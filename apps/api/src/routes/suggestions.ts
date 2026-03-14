import { GoogleGenAI } from "@google/genai";
import {
  aiSuggestionsResponseSchema,
  type MealSuggestion,
  userIdParamsSchema,
} from "@pantrific/schema";
import { readFromEnv } from "@pantrific/shared/utils";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db";
import {
  deficienciesTable,
  dietaryProfilesTable,
  pantryItemTable,
  pantryTable,
  trackedNutrientsTable,
} from "../db/schema";

const ai = new GoogleGenAI({ apiKey: readFromEnv("GEMINI_API_KEY") });
const mealsSchema = z.toJSONSchema(aiSuggestionsResponseSchema);

async function fetchMealImage(searchTerm: string) {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`,
    );
    const data = (await res.json()) as {
      meals: { strMealThumb: string }[] | null;
    };
    return data.meals?.[0]?.strMealThumb ?? null;
  } catch {
    return null;
  }
}

export async function suggestionsRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const { userId } = req.params;

      const [pantries, [profile], deficiencies, nutrients] = await Promise.all([
        db.select().from(pantryTable).where(eq(pantryTable.userId, userId)),
        db
          .select()
          .from(dietaryProfilesTable)
          .where(eq(dietaryProfilesTable.userId, userId)),
        db
          .select()
          .from(deficienciesTable)
          .where(eq(deficienciesTable.userId, userId)),
        db
          .select()
          .from(trackedNutrientsTable)
          .where(eq(trackedNutrientsTable.userId, userId)),
      ]);

      const pantryItems = pantries.length
        ? await db
            .select()
            .from(pantryItemTable)
            .where(eq(pantryItemTable.pantryId, pantries.map((p) => p.id)[0]!))
        : [];

      const allItems =
        pantries.length > 1
          ? await Promise.all(
              pantries.map((p) =>
                db
                  .select()
                  .from(pantryItemTable)
                  .where(eq(pantryItemTable.pantryId, p.id)),
              ),
            ).then((results) => results.flat())
          : pantryItems;

      const ingredientNames = [...new Set(allItems.map((i) => i.name))];

      const prompt = `You are a nutrition-focused chef assistant. Based on the user's available ingredients, dietary goals, and deficiencies, suggest 3-4 practical meals they can make.

Available ingredients:
${ingredientNames.length ? ingredientNames.join(", ") : "No ingredients detected yet — suggest simple, common meals"}

Dietary goals:
${profile ? `- Calorie target: ${profile.calorieTarget ?? "not set"} kcal/day\n- Protein target: ${profile.proteinTarget ?? "not set"} g/day` : "No dietary profile set"}
${nutrients.length ? `\nTRACKED NUTRIENTS:\n${nutrients.map((n) => `- ${n.name}: ${n.dailyTarget} ${n.unit}/day`).join("\n")}` : ""}

Deficiencies you must address:
${deficiencies.length ? deficiencies.map((d) => `- ${d.nutrient} (severity: ${d.severity ?? "unknown"})`).join("\n") : "None specified"}

Requirements:
- Prioritise using the available ingredients
- Address deficiencies where possible
- Include estimated nutrition values matching the tracked nutrients
- Keep recipes practical and achievable
- Return your response as JSON matching the schema`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: mealsSchema,
        },
      });

      const result = aiSuggestionsResponseSchema.parse(
        JSON.parse(response.text ?? "{}"),
      );

      const meals: MealSuggestion[] = await Promise.all(
        result.meals.map(async ({ imageSearchTerm, ...meal }) => ({
          ...meal,
          imageUrl: await fetchMealImage(imageSearchTerm),
        })),
      );

      return { meals };
    },
  );
}

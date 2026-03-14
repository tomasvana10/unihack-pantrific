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
import { db } from "../db";
import {
  deficienciesTable,
  dietaryProfilesTable,
  pantryItemTable,
  pantryTable,
  trackedNutrientsTable,
} from "../db/schema";

const ai = new GoogleGenAI({ apiKey: readFromEnv("GEMINI_API_KEY") });
const mealsSchema = aiSuggestionsResponseSchema.toJSONSchema();

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

async function fetchUserContext(userId: string) {
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

  const allItems = pantries.length
    ? await Promise.all(
        pantries.map((p) =>
          db
            .select()
            .from(pantryItemTable)
            .where(eq(pantryItemTable.pantryId, p.id)),
        ),
      ).then((results) => results.flat())
    : [];

  // Merge items across pantries, summing quantities for duplicates
  const merged = new Map<string, number | null>();
  for (const item of allItems) {
    const existing = merged.get(item.name);
    if (existing === undefined) {
      merged.set(item.name, item.quantity);
    } else if (existing !== null && item.quantity !== null) {
      merged.set(item.name, existing + item.quantity);
    } else {
      // if any occurrence lacks a quantity, just keep it as null
      merged.set(item.name, null);
    }
  }

  const ingredients = [...merged.entries()].map(([name, quantity]) => ({
    name,
    quantity,
  }));

  return { profile, deficiencies, nutrients, ingredients };
}

function formatIngredients(
  ingredients: { name: string; quantity: number | null }[],
) {
  if (!ingredients.length)
    return "No ingredients detected yet — suggest simple, common meals";
  return ingredients
    .map((i) =>
      i.quantity != null ? `- ${i.name} (x${i.quantity})` : `- ${i.name}`,
    )
    .join("\n");
}

function buildSuggestionsPrompt(
  ctx: Awaited<ReturnType<typeof fetchUserContext>>,
) {
  const { profile, deficiencies, nutrients, ingredients } = ctx;
  const dietType = profile?.dietType ?? "none";
  const cuisines = (profile?.cuisinePreferences as string[] | null) ?? [];

  return `You are a nutrition-focused chef assistant. Based on the user's available ingredients, dietary goals, and deficiencies, suggest up to 10 practical meals they can make.

Available ingredients:
${formatIngredients(ingredients)}

Dietary goals:
${profile ? `- Calorie target: ${profile.calorieTarget ?? "not set"} kcal/day\n- Protein target: ${profile.proteinTarget ?? "not set"} g/day` : "No dietary profile set"}
${nutrients.length ? `\nTracked Nutrients:\n${nutrients.map((n) => `- ${n.name}: ${n.dailyTarget} ${n.unit}/day`).join("\n")}` : ""}
${dietType !== "none" ? `\nDiet restriction: ${dietType}.  All meals MUST be strictly ${dietType}.` : ""}
${cuisines.length ? `\nPreferred cuisines: ${cuisines.join(", ")} - favour these cuisine styles when possible.` : ""}

Deficiencies you must address:
${deficiencies.length ? deficiencies.map((d) => `- ${d.nutrient} (severity: ${d.severity ?? "unknown"})`).join("\n") : "None specified"}

Requirements:
- Prioritise using the available ingredients
- Address deficiencies where possible
- Include estimated nutrition values matching the tracked nutrients
- Keep recipes practical and achievable
${dietType !== "none" ? `- Very important! Every meal must be 100% ${dietType}. No exceptions.` : ""}
- Return your response as JSON matching the schema`;
}

export async function suggestionsRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const ctx = await fetchUserContext(req.params.userId);
      const prompt = buildSuggestionsPrompt(ctx);

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

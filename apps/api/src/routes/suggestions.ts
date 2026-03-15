import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import {
  aiSuggestionsResponseSchema,
  type MealSuggestion,
  userIdParamsSchema,
} from "@pantrific/schema";
import { readFromEnv } from "@pantrific/shared/utils";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "../db";
import {
  deficienciesTable,
  dietaryProfilesTable,
  mealCacheTable,
  pantryItemTable,
  pantryTable,
  recipeCacheTable,
  trackedNutrientsTable,
} from "../db/schema";

const ai = new GoogleGenAI({ apiKey: readFromEnv("GEMINI_API_KEY") });
const mealsSchema = aiSuggestionsResponseSchema.toJSONSchema();

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Map Spoonacular nutrient names → our nutrient names */
const NUTRIENT_MAP: Record<string, string> = {
  Calories: "Calories",
  Protein: "Protein",
  Carbohydrates: "Carbohydrates",
  Fat: "Fat",
  Fiber: "Fibre",
  "Vitamin C": "Vitamin C",
  Iron: "Iron",
  Calcium: "Calcium",
  "Vitamin D": "Vitamin D",
  "Vitamin B12": "Vitamin B12",
};

type SpoonacularResult = {
  results: Array<{
    id: number;
    title: string;
    image: string;
    cuisines?: string[];
    nutrition?: {
      nutrients: Array<{ name: string; amount: number; unit: string }>;
    };
  }>;
};

type RecipeData = {
  imageUrl: string | null;
  nutrition: Record<string, number> | null;
  cuisine: string | null;
};

/**
 * Look up recipe data from Spoonacular, with DB-level caching.
 * Falls back gracefully if no API key or request fails.
 */
async function fetchRecipeData(searchTerm: string): Promise<RecipeData> {
  const key = searchTerm.toLowerCase().trim();

  // Check recipe cache first
  const [cached] = await db
    .select()
    .from(recipeCacheTable)
    .where(eq(recipeCacheTable.searchTerm, key))
    .limit(1);

  if (cached) {
    return {
      imageUrl: cached.imageUrl,
      nutrition: cached.nutrition as Record<string, number> | null,
      cuisine: cached.cuisine,
    };
  }

  // No API key → skip external lookup
  if (!SPOONACULAR_KEY) {
    return { imageUrl: null, nutrition: null, cuisine: null };
  }

  try {
    const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
    url.searchParams.set("query", searchTerm);
    url.searchParams.set("number", "1");
    url.searchParams.set("addRecipeNutrition", "true");
    url.searchParams.set("apiKey", SPOONACULAR_KEY);

    const res = await fetch(url);
    if (!res.ok) return { imageUrl: null, nutrition: null, cuisine: null };

    const data = (await res.json()) as SpoonacularResult;
    const recipe = data.results?.[0];

    if (!recipe) {
      // Cache the miss to avoid repeated lookups
      await db
        .insert(recipeCacheTable)
        .values({
          searchTerm: key,
          imageUrl: null,
          nutrition: null,
          cuisine: null,
        })
        .onConflictDoNothing();
      return { imageUrl: null, nutrition: null, cuisine: null };
    }

    // Map Spoonacular nutrients to our format
    const nutrition: Record<string, number> = {};
    if (recipe.nutrition?.nutrients) {
      for (const n of recipe.nutrition.nutrients) {
        const mapped = NUTRIENT_MAP[n.name];
        if (mapped) {
          nutrition[mapped] = Math.round(n.amount * 10) / 10;
        }
      }
    }

    // Upgrade image to higher resolution (default is 312x231)
    const imageUrl = recipe.image
      ? recipe.image.replace(/-\d+x\d+\./, "-636x393.")
      : null;

    const result: RecipeData = {
      imageUrl,
      nutrition: Object.keys(nutrition).length > 0 ? nutrition : null,
      cuisine: recipe.cuisines?.[0] || null,
    };

    // Cache the result
    await db
      .insert(recipeCacheTable)
      .values({
        searchTerm: key,
        imageUrl: result.imageUrl,
        nutrition: result.nutrition,
        cuisine: result.cuisine,
      })
      .onConflictDoNothing();

    return result;
  } catch {
    return { imageUrl: null, nutrition: null, cuisine: null };
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

const MOOD_DESCRIPTIONS: Record<string, string> = {
  energetic:
    "Meals should be energising — rich in complex carbs, B-vitamins, and iron. Think vibrant, uplifting dishes.",
  relaxed:
    "Meals should be calming and comforting — include magnesium-rich foods, warm dishes, and soothing flavours.",
  focused:
    "Meals should support mental clarity — include omega-3 rich foods, antioxidants, and steady-energy ingredients.",
};

function buildSuggestionsPrompt(
  ctx: Awaited<ReturnType<typeof fetchUserContext>>,
  preferences?: { focusNutrient?: string; mood?: string },
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
${preferences?.focusNutrient ? `\nNutrient focus: The user wants meals that are especially high in ${preferences.focusNutrient}. Prioritise this nutrient in every suggestion.` : ""}
${preferences?.mood ? `\nMood goal: ${MOOD_DESCRIPTIONS[preferences.mood] ?? `The user wants to feel ${preferences.mood}.`}` : ""}

Deficiencies you must address:
${deficiencies.length ? deficiencies.map((d) => `- ${d.nutrient} (severity: ${d.severity ?? "unknown"})`).join("\n") : "None specified"}

Requirements:
- Prioritise using the available ingredients
- Address deficiencies where possible
- Include estimated nutrition values matching the tracked nutrients. Use human-readable names as keys (e.g. "Vitamin C" not "vitaminC", "Calories" not "calories")
- Keep recipes practical and achievable
- For each meal, classify which cuisine it belongs to (e.g., Italian, Japanese, Indian, Thai, Mexican, etc.)
- For imageSearchTerm, use a simple, common name for the dish that would match a recipe database (e.g., "chicken tikka masala" instead of "spiced yogurt chicken curry")
${dietType !== "none" ? `- Very important! Every meal must be 100% ${dietType}. No exceptions.` : ""}
- Return your response as JSON matching the schema`;
}

function computeContextHash(
  ctx: Awaited<ReturnType<typeof fetchUserContext>>,
  preferences?: { focusNutrient?: string; mood?: string },
): string {
  const data = JSON.stringify({
    profile: ctx.profile,
    ingredients: ctx.ingredients,
    nutrients: ctx.nutrients,
    deficiencies: ctx.deficiencies,
    focusNutrient: preferences?.focusNutrient,
    mood: preferences?.mood,
  });
  return createHash("sha256").update(data).digest("hex").slice(0, 16);
}

export async function suggestionsRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const query = req.query as Record<string, string>;
      const preferences = {
        focusNutrient: query.focusNutrient || undefined,
        mood: query.mood || undefined,
      };
      const ctx = await fetchUserContext(req.params.userId);
      const contextHash = computeContextHash(ctx, preferences);

      // Check meal suggestions cache (1 hour TTL, same context)
      const cutoff = new Date(Date.now() - CACHE_TTL_MS);
      const [cached] = await db
        .select()
        .from(mealCacheTable)
        .where(
          and(
            eq(mealCacheTable.userId, req.params.userId),
            eq(mealCacheTable.contextHash, contextHash),
            gt(mealCacheTable.createdAt, cutoff),
          ),
        )
        .limit(1);

      if (cached) {
        return { meals: cached.meals as MealSuggestion[] };
      }

      // Generate with AI
      const prompt = buildSuggestionsPrompt(ctx, preferences);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: mealsSchema,
        },
      });

      if (!response.text) throw new Error("Empty response from AI");
      const result = aiSuggestionsResponseSchema.parse(
        JSON.parse(response.text),
      );

      // Enrich each meal with Spoonacular data (parallel)
      const meals: MealSuggestion[] = await Promise.all(
        result.meals.map(async ({ imageSearchTerm, ...meal }) => {
          const recipeData = await fetchRecipeData(imageSearchTerm);
          return {
            ...meal,
            // Prefer Spoonacular nutrition (accurate), fall back to AI estimates
            estimatedNutrition: recipeData.nutrition ?? meal.estimatedNutrition,
            imageUrl: recipeData.imageUrl,
            // Prefer Spoonacular cuisine, fall back to AI classification
            cuisine: recipeData.cuisine || meal.cuisine,
          };
        }),
      );

      // Cache the enriched result set
      await db.insert(mealCacheTable).values({
        userId: req.params.userId,
        contextHash,
        meals: meals as unknown[],
      });

      return { meals };
    },
  );
}

import { z } from "zod";

export const mealIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
});

export const mealSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(mealIngredientSchema),
  steps: z.array(z.string()),
  estimatedNutrition: z.record(z.string(), z.number()),
  imageUrl: z.string().nullable(),
  cuisine: z.string().nullable(),
  benefits: z.string(),
});

export type MealSuggestion = z.infer<typeof mealSuggestionSchema>;

export const aiMealSuggestionSchema = mealSuggestionSchema
  .omit({ imageUrl: true })
  .extend({ imageSearchTerm: z.string() });

export const aiSuggestionsResponseSchema = z.object({
  meals: z.array(aiMealSuggestionSchema),
});

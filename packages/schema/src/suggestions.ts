import { z } from "zod";

export const mealSuggestionSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  benefits: z.string(),
});

export type MealSuggestion = z.infer<typeof mealSuggestionSchema>;

export const suggestionsResponseSchema = z.object({
  meals: z.array(mealSuggestionSchema),
});

export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>;

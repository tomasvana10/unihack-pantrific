import { z } from "zod";

export const dietTypeEnum = z.enum(["none", "vegetarian", "vegan"]);
export type DietType = z.infer<typeof dietTypeEnum>;

export const dietaryProfileSchema = z.object({
  calorieTarget: z.number().int().positive().optional(),
  proteinTarget: z.number().positive().optional(),
  dietType: dietTypeEnum.optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  gender: z.enum(["male", "female"]).optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
});

export type DietaryProfileInput = z.infer<typeof dietaryProfileSchema>;

export const autoSetupSchema = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().positive(),
  weight: z.number().positive(),
});

export type AutoSetupInput = z.infer<typeof autoSetupSchema>;

export const autoSetupResponseSchema = z.object({
  calorieTarget: z.number().int().positive(),
  proteinTarget: z.number().positive(),
  nutrients: z.array(
    z.object({
      name: z.string(),
      unit: z.string(),
      dailyTarget: z.number().positive(),
    }),
  ),
});

export type AutoSetupResponse = z.infer<typeof autoSetupResponseSchema>;

export const deficiencySchema = z.object({
  nutrient: z.string().min(1),
  severity: z.enum(["low", "moderate", "high"]).optional(),
});

export type DeficiencyInput = z.infer<typeof deficiencySchema>;

import { z } from "zod";

export const dietTypeEnum = z.enum(["none", "vegetarian", "vegan"]);
export type DietType = z.infer<typeof dietTypeEnum>;

export const DIET_TYPES = dietTypeEnum.options;

export const severityEnum = z.enum(["low", "moderate", "high"]);
export type Severity = z.infer<typeof severityEnum>;

export const SEVERITIES = severityEnum.options;

export const genderEnum = z.enum(["male", "female"]);
export type Gender = z.infer<typeof genderEnum>;

export const GENDERS = genderEnum.options;

export const dietaryProfileSchema = z.object({
  calorieTarget: z.number().int().positive().optional(),
  proteinTarget: z.number().positive().optional(),
  dietType: dietTypeEnum.optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  gender: genderEnum.optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
});

export const autoSetupSchema = z.object({
  gender: genderEnum,
  age: z.number().int().positive(),
  weight: z.number().positive(),
});

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

export const deficiencySchema = z.object({
  nutrient: z.string().min(1),
  severity: severityEnum.optional(),
});

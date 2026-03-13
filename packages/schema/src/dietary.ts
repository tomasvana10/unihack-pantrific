import { z } from "zod";

export const dietaryProfileSchema = z.object({
  calorieTarget: z.number().int().positive().optional(),
  proteinTarget: z.number().positive().optional(),
});

export type DietaryProfileInput = z.infer<typeof dietaryProfileSchema>;

export const deficiencySchema = z.object({
  nutrient: z.string().min(1),
  severity: z.enum(["low", "moderate", "high"]).optional(),
});

export type DeficiencyInput = z.infer<typeof deficiencySchema>;

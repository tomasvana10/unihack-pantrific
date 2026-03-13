import { z } from "zod";

export const trackedNutrientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  dailyTarget: z.number().positive(),
});

export type TrackedNutrientInput = z.infer<typeof trackedNutrientSchema>;

export const intakeLogSchema = z.object({
  trackedNutrientId: z.uuid(),
  amount: z.number().positive(),
});

export type IntakeLogInput = z.infer<typeof intakeLogSchema>;

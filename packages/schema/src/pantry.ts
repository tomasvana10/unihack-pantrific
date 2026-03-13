import { z } from "zod";

export const createPantrySchema = z.object({
  name: z.string().min(1),
});

export type CreatePantry = z.infer<typeof createPantrySchema>;

export const detectedItemSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type DetectedItem = z.infer<typeof detectedItemSchema>;

export const replaceItemsSchema = z.object({
  items: z.array(detectedItemSchema).min(1),
});

export type ReplaceItems = z.infer<typeof replaceItemsSchema>;

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export const pantryParamsSchema = z.object({
  userId: z.uuid(),
  pantryId: z.uuid(),
});

export type PantryParams = z.infer<typeof pantryParamsSchema>;

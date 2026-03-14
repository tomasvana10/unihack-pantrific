import { z } from "zod";

export const createPantrySchema = z.object({
  name: z.string().min(1),
});

export const detectedItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  confidence: z.number().min(0).max(1),
});

export const replaceItemsSchema = z.object({
  items: z.array(detectedItemSchema).min(1),
});

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export const pantryParamsSchema = z.object({
  userId: z.uuid(),
  pantryId: z.uuid(),
});

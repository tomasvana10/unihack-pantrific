import { z } from "zod";

export const detectedItemSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type DetectedItem = z.infer<typeof detectedItemSchema>;

export const detectBodySchema = z.object({
  userId: z.uuid(),
  items: z.array(detectedItemSchema).min(1),
});

export type DetectBody = z.infer<typeof detectBodySchema>;

export const userIdParamsSchema = z.object({
  userId: z.uuid(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

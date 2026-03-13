import { detectBodySchema, userIdParamsSchema } from "@pantrific/schema";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "../db";
import { pantryTable } from "../db/schema";

export async function pantryRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.post("/detect", { schema: { body: detectBodySchema } }, async (req) => {
    const { userId, items } = req.body;
    const inserted = await db
      .insert(pantryTable)
      .values(
        items.map((item) => ({
          userId,
          name: item.name,
          confidence: item.confidence,
        })),
      )
      .returning();

    return { items: inserted };
  });

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const items = await db
        .select()
        .from(pantryTable)
        .where(eq(pantryTable.userId, req.params.userId));

      return { items };
    },
  );
}

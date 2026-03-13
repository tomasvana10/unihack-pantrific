import {
  createPantrySchema,
  pantryParamsSchema,
  replaceItemsSchema,
  userIdParamsSchema,
} from "@pantrific/schema";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "../db";
import { pantryItemTable, pantryTable } from "../db/schema";

export async function pantryRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.post(
    "/:userId",
    { schema: { params: userIdParamsSchema, body: createPantrySchema } },
    async (req, reply) => {
      const [pantry] = await db
        .insert(pantryTable)
        .values({ userId: req.params.userId, name: req.body.name })
        .returning();

      return reply.code(201).send(pantry);
    },
  );

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const pantries = await db
        .select()
        .from(pantryTable)
        .where(eq(pantryTable.userId, req.params.userId));

      return { pantries };
    },
  );

  base.delete(
    "/:userId/:pantryId",
    { schema: { params: pantryParamsSchema } },
    async (req, reply) => {
      await db
        .delete(pantryTable)
        .where(
          and(
            eq(pantryTable.id, req.params.pantryId),
            eq(pantryTable.userId, req.params.userId),
          ),
        );

      return reply.code(204).send();
    },
  );

  base.put(
    "/:userId/:pantryId/items",
    { schema: { params: pantryParamsSchema, body: replaceItemsSchema } },
    async (req) => {
      const { pantryId } = req.params;
      const { items } = req.body;

      const inserted = await db.transaction(async (tx) => {
        await tx
          .delete(pantryItemTable)
          .where(eq(pantryItemTable.pantryId, pantryId));

        return tx
          .insert(pantryItemTable)
          .values(
            items.map((item) => ({
              pantryId,
              name: item.name,
              confidence: item.confidence,
            })),
          )
          .returning();
      });

      return { items: inserted };
    },
  );

  base.get(
    "/:userId/:pantryId/items",
    { schema: { params: pantryParamsSchema } },
    async (req) => {
      const items = await db
        .select()
        .from(pantryItemTable)
        .where(eq(pantryItemTable.pantryId, req.params.pantryId));

      return { items };
    },
  );
}

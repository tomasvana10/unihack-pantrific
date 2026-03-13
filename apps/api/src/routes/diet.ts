import {
  deficiencySchema,
  dietaryProfileSchema,
  userIdParamsSchema,
} from "@pantrific/schema";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db";
import { deficienciesTable, dietaryProfilesTable } from "../db/schema";

export async function dietRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const [profileRows, deficiencyRows] = await Promise.all([
        db
          .select()
          .from(dietaryProfilesTable)
          .where(eq(dietaryProfilesTable.userId, req.params.userId)),
        db
          .select()
          .from(deficienciesTable)
          .where(eq(deficienciesTable.userId, req.params.userId)),
      ]);
      return {
        profile: profileRows[0] ?? null,
        deficiencies: deficiencyRows,
      };
    },
  );

  base.put(
    "/:userId/profile",
    {
      schema: {
        params: userIdParamsSchema,
        body: dietaryProfileSchema,
      },
    },
    async (req) => {
      const existing = await db
        .select()
        .from(dietaryProfilesTable)
        .where(eq(dietaryProfilesTable.userId, req.params.userId));

      if (existing.length > 0) {
        const [updated] = await db
          .update(dietaryProfilesTable)
          .set(req.body)
          .where(eq(dietaryProfilesTable.userId, req.params.userId))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(dietaryProfilesTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();
      return created;
    },
  );

  base.put(
    "/:userId/deficiencies",
    {
      schema: {
        params: userIdParamsSchema,
        body: z.array(deficiencySchema),
      },
    },
    async (req) => {
      await db
        .delete(deficienciesTable)
        .where(eq(deficienciesTable.userId, req.params.userId));

      if (req.body.length === 0) {
        return { deficiencies: [] };
      }

      const inserted = await db
        .insert(deficienciesTable)
        .values(req.body.map((d) => ({ userId: req.params.userId, ...d })))
        .returning();
      return { deficiencies: inserted };
    },
  );

  base.post(
    "/:userId/deficiencies",
    {
      schema: {
        params: userIdParamsSchema,
        body: deficiencySchema,
      },
    },
    async (req, reply) => {
      const [inserted] = await db
        .insert(deficienciesTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();
      return reply.code(201).send(inserted);
    },
  );

  base.delete(
    "/:userId/deficiencies/:deficiencyId",
    {
      schema: {
        params: userIdParamsSchema.extend({
          deficiencyId: z.uuid(),
        }),
      },
    },
    async (req, reply) => {
      await db
        .delete(deficienciesTable)
        .where(eq(deficienciesTable.id, req.params.deficiencyId));
      return reply.code(204).send();
    },
  );
}

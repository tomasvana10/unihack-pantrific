import {
  intakeLogSchema,
  trackedNutrientSchema,
  userIdParamsSchema,
} from "@pantrific/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db";
import { intakeLogsTable, trackedNutrientsTable } from "../db/schema";

export async function trackingRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  // get all tracked nutrients for a user
  base.get(
    "/:userId/nutrients",
    { schema: { params: userIdParamsSchema } },
    async (req) => {
      const nutrients = await db
        .select()
        .from(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.userId, req.params.userId));
      return { nutrients };
    },
  );

  // add a tracked nutrient
  base.post(
    "/:userId/nutrients",
    {
      schema: {
        params: userIdParamsSchema,
        body: trackedNutrientSchema,
      },
    },
    async (req) => {
      const [created] = await db
        .insert(trackedNutrientsTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();
      return created;
    },
  );

  // update a tracked nutrient's target
  base.put(
    "/:userId/nutrients/:nutrientId",
    {
      schema: {
        params: userIdParamsSchema.extend({ nutrientId: z.uuid() }),
        body: trackedNutrientSchema.partial(),
      },
    },
    async (req) => {
      const [updated] = await db
        .update(trackedNutrientsTable)
        .set(req.body)
        .where(eq(trackedNutrientsTable.id, req.params.nutrientId))
        .returning();
      return updated;
    },
  );

  // remove a tracked nutrient
  base.delete(
    "/:userId/nutrients/:nutrientId",
    {
      schema: {
        params: userIdParamsSchema.extend({ nutrientId: z.uuid() }),
      },
    },
    async (req) => {
      await db
        .delete(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.id, req.params.nutrientId));
      return { ok: true };
    },
  );

  // log intake for a tracked nutrient
  base.post(
    "/:userId/log",
    {
      schema: {
        params: userIdParamsSchema,
        body: intakeLogSchema,
      },
    },
    async (req) => {
      const [created] = await db
        .insert(intakeLogsTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();

      return created;
    },
  );

  // daily summary, consisting of how much of a nutrient is tracked vs the target
  base.get(
    "/:userId/daily",
    {
      schema: {
        params: userIdParamsSchema,
        querystring: z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        }),
      },
    },
    async (req) => {
      const date = req.query.date ?? new Date().toISOString().split("T")[0];
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59.999`);

      const nutrients = await db
        .select()
        .from(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.userId, req.params.userId));

      const totals = await db
        .select({
          trackedNutrientId: intakeLogsTable.trackedNutrientId,
          total: sql<number>`coalesce(sum(${intakeLogsTable.amount}), 0)`,
        })
        .from(intakeLogsTable)
        .where(
          and(
            eq(intakeLogsTable.userId, req.params.userId),
            gte(intakeLogsTable.loggedAt, dayStart),
            lt(intakeLogsTable.loggedAt, dayEnd),
          ),
        )
        .groupBy(intakeLogsTable.trackedNutrientId);

      const nutrientToTotal = new Map(
        totals.map((t) => [t.trackedNutrientId, t.total]),
      );

      return {
        date,
        nutrients: nutrients.map((n) => ({
          ...n,
          consumed: nutrientToTotal.get(n.id) ?? 0,
          remaining: n.dailyTarget - (nutrientToTotal.get(n.id) ?? 0),
        })),
      };
    },
  );

  // delete a specific intake log
  base.delete(
    "/:userId/log/:logId",
    {
      schema: {
        params: userIdParamsSchema.extend({ logId: z.uuid() }),
      },
    },
    async (req) => {
      await db
        .delete(intakeLogsTable)
        .where(eq(intakeLogsTable.id, req.params.logId));
      return { ok: true };
    },
  );
}

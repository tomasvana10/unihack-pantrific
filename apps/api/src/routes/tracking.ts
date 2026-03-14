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

async function getDayTotals(userId: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const totals = await db
    .select({
      trackedNutrientId: intakeLogsTable.trackedNutrientId,
      total: sql<number>`coalesce(sum(${intakeLogsTable.amount}), 0)`,
    })
    .from(intakeLogsTable)
    .where(
      and(
        eq(intakeLogsTable.userId, userId),
        gte(intakeLogsTable.loggedAt, dayStart),
        lt(intakeLogsTable.loggedAt, dayEnd),
      ),
    )
    .groupBy(intakeLogsTable.trackedNutrientId);

  return new Map(totals.map((t) => [t.trackedNutrientId, t.total]));
}

export async function trackingRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

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

  base.post(
    "/:userId/nutrients",
    {
      schema: {
        params: userIdParamsSchema,
        body: trackedNutrientSchema,
      },
    },
    async (req, reply) => {
      const [created] = await db
        .insert(trackedNutrientsTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();
      return reply.code(201).send(created);
    },
  );

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

  base.delete(
    "/:userId/nutrients/:nutrientId",
    {
      schema: {
        params: userIdParamsSchema.extend({ nutrientId: z.uuid() }),
      },
    },
    async (req, reply) => {
      await db
        .delete(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.id, req.params.nutrientId));
      return reply.code(204).send();
    },
  );

  base.post(
    "/:userId/logs",
    {
      schema: {
        params: userIdParamsSchema,
        body: intakeLogSchema,
      },
    },
    async (req, reply) => {
      const [created] = await db
        .insert(intakeLogsTable)
        .values({ userId: req.params.userId, ...req.body })
        .returning();

      return reply.code(201).send(created);
    },
  );

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
      const date = req.query.date ?? new Date().toISOString().split("T")[0]!;

      const [nutrients, totals] = await Promise.all([
        db
          .select()
          .from(trackedNutrientsTable)
          .where(eq(trackedNutrientsTable.userId, req.params.userId)),
        getDayTotals(req.params.userId, date),
      ]);

      return {
        date,
        nutrients: nutrients.map((n) => ({
          ...n,
          consumed: totals.get(n.id) ?? 0,
          remaining: n.dailyTarget - (totals.get(n.id) ?? 0),
        })),
      };
    },
  );

  base.get(
    "/:userId/history",
    {
      schema: {
        params: userIdParamsSchema,
        querystring: z.object({
          days: z.coerce.number().int().positive().default(7),
        }),
      },
    },
    async (req) => {
      const { userId } = req.params;
      const days = req.query.days;

      const nutrients = await db
        .select()
        .from(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.userId, userId));

      const history = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0]!;
        const totals = await getDayTotals(userId, dateStr);

        history.push({
          date: dateStr,
          nutrients: nutrients.map((n) => ({
            id: n.id,
            name: n.name,
            unit: n.unit,
            dailyTarget: n.dailyTarget,
            consumed: totals.get(n.id) ?? 0,
          })),
        });
      }

      return { history };
    },
  );

  base.delete(
    "/:userId/logs/:logId",
    {
      schema: {
        params: userIdParamsSchema.extend({ logId: z.uuid() }),
      },
    },
    async (req, reply) => {
      await db
        .delete(intakeLogsTable)
        .where(eq(intakeLogsTable.id, req.params.logId));
      return reply.code(204).send();
    },
  );
}

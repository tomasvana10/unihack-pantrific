import {
  intakeLogSchema,
  trackedNutrientSchema,
  userIdParamsSchema,
} from "@pantrific/schema";
import { toDateString } from "@pantrific/shared/utils";
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

async function getRangeTotals(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const rangeStart = new Date(`${startDate}T00:00:00`);
  const rangeEnd = new Date(`${endDate}T23:59:59.999`);

  const totals = await db
    .select({
      trackedNutrientId: intakeLogsTable.trackedNutrientId,
      date: sql<string>`to_char(${intakeLogsTable.loggedAt}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${intakeLogsTable.amount}), 0)`,
    })
    .from(intakeLogsTable)
    .where(
      and(
        eq(intakeLogsTable.userId, userId),
        gte(intakeLogsTable.loggedAt, rangeStart),
        lt(intakeLogsTable.loggedAt, rangeEnd),
      ),
    )
    .groupBy(
      intakeLogsTable.trackedNutrientId,
      sql`to_char(${intakeLogsTable.loggedAt}, 'YYYY-MM-DD')`,
    );

  const map = new Map<string, Map<string, number>>();
  for (const t of totals) {
    if (!map.has(t.date)) map.set(t.date, new Map());
    map.get(t.date)!.set(t.trackedNutrientId, t.total);
  }
  return map;
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
      const date = req.query.date ?? toDateString();

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

      const dates: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(toDateString(d));
      }

      const [nutrients, rangeTotals] = await Promise.all([
        db
          .select()
          .from(trackedNutrientsTable)
          .where(eq(trackedNutrientsTable.userId, userId)),
        getRangeTotals(userId, dates[0]!, dates[dates.length - 1]!),
      ]);

      const history = dates.map((dateStr) => {
        const dayTotals = rangeTotals.get(dateStr);
        return {
          date: dateStr,
          nutrients: nutrients.map((n) => ({
            id: n.id,
            name: n.name,
            unit: n.unit,
            dailyTarget: n.dailyTarget,
            consumed: dayTotals?.get(n.id) ?? 0,
          })),
        };
      });

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

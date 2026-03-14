import { GoogleGenAI } from "@google/genai";
import {
  autoSetupResponseSchema,
  autoSetupSchema,
  COMMON_NUTRIENTS,
  deficiencySchema,
  dietaryProfileSchema,
  userIdParamsSchema,
} from "@pantrific/schema";
import { readFromEnv } from "@pantrific/shared/utils";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db";
import {
  deficienciesTable,
  dietaryProfilesTable,
  trackedNutrientsTable,
} from "../db/schema";

const ai = new GoogleGenAI({ apiKey: readFromEnv("GEMINI_API_KEY") });

function buildAutoSetupPrompt(gender: string, age: number, weight: number) {
  const nutrientNames = COMMON_NUTRIENTS.filter(
    (n) => n.name !== "Calories" && n.name !== "Protein",
  )
    .map((n) => n.name)
    .join(", ");

  return `You are a nutrition expert. Given the following person's demographics, recommend their optimal daily nutrient intake targets.

Gender: ${gender}
Age: ${age} years
Weight: ${weight} kg

Return recommended daily values for:
- Calorie target (kcal)
- Protein target (g)
- And 8-10 key nutrients (e.g. ${nutrientNames}, etc.)

Use established dietary reference intake (DRI) values from health organisations. Adjust for the person's demographics.
Return as JSON matching the schema.`;
}

async function upsertProfile(userId: string, data: Record<string, unknown>) {
  const existing = await db
    .select()
    .from(dietaryProfilesTable)
    .where(eq(dietaryProfilesTable.userId, userId));

  if (existing.length > 0) {
    const [updated] = await db
      .update(dietaryProfilesTable)
      .set(data)
      .where(eq(dietaryProfilesTable.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(dietaryProfilesTable)
    .values({ userId, ...data })
    .returning();
  return created;
}

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
    async (req) => upsertProfile(req.params.userId, req.body),
  );

  base.post(
    "/:userId/auto-setup",
    {
      schema: {
        params: userIdParamsSchema,
        body: autoSetupSchema,
      },
    },
    async (req) => {
      const { userId } = req.params;
      const { gender, age, weight } = req.body;

      const prompt = buildAutoSetupPrompt(gender, age, weight);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(autoSetupResponseSchema),
        },
      });

      if (!response.text) throw new Error("Empty response from AI");
      const raw = autoSetupResponseSchema.parse(JSON.parse(response.text));

      // Deduplicate nutrients by name and exclude Calories/Protein (tracked separately)
      const seen = new Set<string>();
      const result = {
        ...raw,
        nutrients: raw.nutrients.filter((n) => {
          const key = n.name.toLowerCase();
          if (seen.has(key) || key === "calories" || key === "protein")
            return false;
          seen.add(key);
          return true;
        }),
      };

      await upsertProfile(userId, {
        calorieTarget: result.calorieTarget,
        proteinTarget: result.proteinTarget,
        gender,
        age,
        weight,
      });

      await db
        .delete(trackedNutrientsTable)
        .where(eq(trackedNutrientsTable.userId, userId));

      await db.insert(trackedNutrientsTable).values(
        result.nutrients.map((n) => ({
          userId,
          name: n.name,
          unit: n.unit,
          dailyTarget: n.dailyTarget,
        })),
      );

      return result;
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

import Anthropic from "@anthropic-ai/sdk";
import { userIdParamsSchema } from "@pantrific/schema";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const anthropic = new Anthropic();

export async function suggestionsRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.get(
    "/:userId",
    { schema: { params: userIdParamsSchema } },
    async (_req) => {
      /*
      const [items, [profile], userDeficiencies] = await Promise.all([
        db
          .select()
          .from(pantryTable)
          .where(eq(pantryTable.userId, req.params.userId)),
        db
          .select()
          .from(dietaryProfilesTable)
          .where(eq(dietaryProfilesTable.userId, req.params.userId)),
        db
          .select()
          .from(deficienciesTable)
          .where(eq(deficienciesTable.userId, req.params.userId)),
      ]);
      */

      const message = await anthropic.messages.create({
        model: "", // add later
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a nutrition assistant. Based on the following, suggest 3 meals.
            todo
            `,
          },
        ],
      });

      return message.content[0];
    },
  );
}

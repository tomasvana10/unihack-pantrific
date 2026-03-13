import { signInSchema, signUpSchema } from "@pantrific/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "../db";
import { userTable } from "../db/schema";

function generateToken() {
  return crypto.randomUUID();
}

export async function authRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.post(
    "/register",
    { schema: { body: signUpSchema } },
    async (req, reply) => {
      const { username, password } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);
      const token = generateToken();
      const [user] = await db
        .insert(userTable)
        .values({ username, passwordHash, token })
        .returning({
          id: userTable.id,
          username: userTable.username,
          token: userTable.token,
        });

      return reply.code(201).send(user);
    },
  );

  base.post(
    "/login",
    { schema: { body: signInSchema } },
    async (req, reply) => {
      const { username, password } = req.body;
      const [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.username, username));

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      const token = generateToken();
      await db
        .update(userTable)
        .set({ token })
        .where(eq(userTable.id, user.id));

      return { id: user.id, username: user.username, token };
    },
  );
}

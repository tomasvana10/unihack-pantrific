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

function generateUsername(displayName: string) {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const suffix = crypto.randomUUID().slice(0, 4);
  return `${base}-${suffix}`;
}

export async function authRoutes(app: FastifyInstance) {
  const base = app.withTypeProvider<ZodTypeProvider>();

  base.post(
    "/register",
    { schema: { body: signUpSchema } },
    async (req, reply) => {
      const { displayName, password } = req.body;
      const username = generateUsername(displayName);
      const passwordHash = await bcrypt.hash(password, 10);
      const token = generateToken();
      const [user] = await db
        .insert(userTable)
        .values({ displayName, username, passwordHash, token })
        .returning({
          id: userTable.id,
          displayName: userTable.displayName,
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

      return {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        token,
      };
    },
  );
}

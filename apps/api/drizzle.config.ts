import { readFromEnv } from "@pantrific/shared/utils";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: readFromEnv("DATABASE_URL"),
  },
});

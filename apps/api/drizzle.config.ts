import "dotenv/config";
import { readFromEnv } from "@pantrific/shared/utils";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: readFromEnv("DATABASE_URL"),
  },
});

import path from "node:path";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

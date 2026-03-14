import "dotenv/config";
import bearerAuth from "@fastify/bearer-auth";
import cors from "@fastify/cors";
import { readFromEnv } from "@pantrific/shared/utils";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { checkDbConnection } from "./db";
import { authRoutes } from "./routes/auth";
import { dietRoutes } from "./routes/diet";
import { pantryRoutes } from "./routes/pantry";
import { suggestionsRoutes } from "./routes/suggestions";
import { trackingRoutes } from "./routes/tracking";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "i'm alive" }));
app.register(authRoutes, { prefix: "/auth" });

await app.register(async (secure) => {
  await secure.register(bearerAuth, {
    addHook: true,
    keys: new Set([readFromEnv("APP_ACCESS_KEY")]),
  });

  secure.register(dietRoutes, { prefix: "/diets" });
  secure.register(pantryRoutes, { prefix: "/pantries" });
  secure.register(suggestionsRoutes, { prefix: "/suggestions" });
  secure.register(trackingRoutes, { prefix: "/tracking" });
});

try {
  await checkDbConnection();
} catch (err) {
  app.log.error(err, "couldn't connect to database or missing migrations!!");
  process.exit(1);
}

const port = +readFromEnv("PORT");
app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

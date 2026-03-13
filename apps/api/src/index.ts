import "dotenv/config";
import { readFromEnv } from "@pantrific/shared/utils";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { authRoutes } from "./routes/auth";
import { dietRoutes } from "./routes/diet";
import { pantryRoutes } from "./routes/pantry";
import { suggestionsRoutes } from "./routes/suggestions";
import { trackingRoutes } from "./routes/tracking";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(authRoutes, { prefix: "/auth" });
app.register(dietRoutes, { prefix: "/diets" });
app.register(pantryRoutes, { prefix: "/pantries" });
app.register(suggestionsRoutes, { prefix: "/suggestions" });
app.register(trackingRoutes, { prefix: "/tracking" });

app.get("/health", async () => ({ status: "i'm alive" }));

const port = +readFromEnv("PORT");
app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

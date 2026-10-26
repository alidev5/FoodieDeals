import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { createDependencies, readEnv } from "./env";

const port = Number(process.env.PORT ?? 3000);
const app = createApp(createDependencies(readEnv((name) => process.env[name])));

serve({ fetch: app.fetch, port }, () => {
  console.log(`FoodieDeals API listening on http://localhost:${port}/api`);
});

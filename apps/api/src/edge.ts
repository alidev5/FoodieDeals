import { createApp } from "./app";
import { createDependencies, readEnv } from "./env";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(
    options: { port: number },
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
};

const app = createApp(createDependencies(readEnv((name) => Deno.env.get(name))));

const bootedAt = Date.now();

// Supabase ignores the port; it only matters when docker-compose runs this file with plain Deno.
// Server-Timing shows how long the API itself took versus Supabase's own overhead.
Deno.serve({ port: Number(Deno.env.get("PORT") ?? 8000) }, async (request) => {
  const startedAt = performance.now();
  const response = await app.fetch(request);
  const timed = new Response(response.body, response);
  timed.headers.set(
    "Server-Timing",
    `app;dur=${Math.round(performance.now() - startedAt)}, instance;desc="up ${Date.now() - bootedAt}ms"`,
  );
  return timed;
});

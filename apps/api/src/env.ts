import { z } from "zod";

import { createSql } from "./db";
import { createSupabaseRealtimeSender, noopRealtimeSender, type RealtimeSender } from "./realtime";
import { createStripeClient } from "./stripe";

const envSchema = z.object({
  // Supabase injects SUPABASE_DB_URL into edge functions; locally it's DATABASE_URL.
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  // Optional: without it, orders are created by syncing the payment intent after checkout.
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  // Both set automatically inside Supabase. Without them realtime is off and the apps poll.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function readEnv(get: (name: string) => string | undefined): Env {
  const result = envSchema.safeParse({
    DATABASE_URL: get("SUPABASE_DB_URL") || get("DATABASE_URL"),
    STRIPE_SECRET_KEY: get("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: get("STRIPE_WEBHOOK_SECRET") || undefined,
    SUPABASE_URL: get("SUPABASE_URL") || undefined,
    SUPABASE_SERVICE_ROLE_KEY: get("SUPABASE_SERVICE_ROLE_KEY") || undefined,
  });
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}

export function createDependencies(env: Env) {
  const realtime: RealtimeSender =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseRealtimeSender(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      : noopRealtimeSender;

  return {
    sql: createSql(env.DATABASE_URL),
    stripe: createStripeClient(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET),
    realtime,
  };
}

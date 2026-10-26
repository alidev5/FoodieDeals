import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  STRIPE_SECRET_KEY: z.string().min(1),
  // Optional: without it, orders are created by syncing the payment intent after checkout.
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}

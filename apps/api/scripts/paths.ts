import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export const MIGRATIONS_DIR = join(repoRoot, "supabase", "migrations");
export const SEED_FILE = join(repoRoot, "supabase", "seed.sql");
export const EDGE_FUNCTION_FILE = join(repoRoot, "supabase", "functions", "api", "index.js");

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set (see apps/api/.env.example)");
  }
  return url;
}

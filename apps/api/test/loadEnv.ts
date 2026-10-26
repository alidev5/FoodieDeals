import { existsSync } from "node:fs";

// CI passes DATABASE_URL directly; locally it comes from apps/api/.env.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  process.loadEnvFile(".env");
}

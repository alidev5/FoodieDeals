import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { MIGRATIONS_DIR, requireDatabaseUrl } from "./paths";

// Same bookkeeping table Supabase uses, so local, CI and hosted databases agree on what ran.
const sql = postgres(requireDatabaseUrl(), { onnotice: () => {} });

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS supabase_migrations`;
  await sql`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY, statements text[], name text
    )`;

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const applied = new Set(
    (
      await sql<{ version: string }[]>`SELECT version FROM supabase_migrations.schema_migrations`
    ).map((row) => row.version),
  );

  // Databases created by the old Prisma setup already have these; record them instead of re-running.
  const [prismaTable] = await sql`SELECT to_regclass('public._prisma_migrations') AS name`;
  if (prismaTable?.name) {
    const prismaApplied = await sql<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
    for (const { migration_name } of prismaApplied) {
      const [version, ...rest] = migration_name.split("_");
      if (version && !applied.has(version)) {
        await sql`
          INSERT INTO supabase_migrations.schema_migrations (version, name)
          VALUES (${version}, ${rest.join("_")})`;
        applied.add(version);
      }
    }
  }

  for (const file of files) {
    const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
    if (!version || applied.has(version)) continue;

    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
      await tx`
        INSERT INTO supabase_migrations.schema_migrations (version, name)
        VALUES (${version}, ${rest.join("_")})`;
    });
    console.log(`Applied ${file}`);
  }
  console.log("Database is up to date.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());

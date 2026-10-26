import postgres from "postgres";

import { requireDatabaseUrl } from "./paths";
import { buildSeedSql } from "./seedSql";

const sql = postgres(requireDatabaseUrl(), { onnotice: () => {} });

// `--if-empty` seeds a fresh database only, so restarting Docker keeps changes made in the apps.
const onlyIfEmpty = process.argv.includes("--if-empty");

async function main() {
  if (onlyIfEmpty) {
    const [row] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM "Restaurant"`;
    if (row && row.count > 0) {
      console.log("Database already has data; skipping the seed.");
      return;
    }
  }
  await sql.unsafe(buildSeedSql());
  console.log("Seeded restaurants, menus, deals and demo customers.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());

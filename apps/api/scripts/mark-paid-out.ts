import postgres from "postgres";

import { requireDatabaseUrl } from "./paths";

// Charges settle on the platform account, so restaurant payouts are sent by hand.
// After sending one, run this to mark that restaurant's picked-up orders as paid out:
//   pnpm --filter api run payouts:mark-paid <restaurantId>
const restaurantId = process.argv[2];
if (!restaurantId) {
  throw new Error("Usage: payouts:mark-paid <restaurantId>");
}

const sql = postgres(requireDatabaseUrl(), { onnotice: () => {} });

async function main() {
  const rows = await sql<{ restaurantReceivesCents: number }[]>`
    UPDATE "Order" SET "paidOutAt" = now(), "updatedAt" = now()
    WHERE "restaurantId" = ${restaurantId!} AND "paidOutAt" IS NULL AND "status" = 'PICKED_UP'
    RETURNING "restaurantReceivesCents"`;
  const amount = (rows.reduce((sum, row) => sum + row.restaurantReceivesCents, 0) / 100).toFixed(2);
  console.log(`Marked ${rows.length} order(s) for ${restaurantId} as paid out ($${amount}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());

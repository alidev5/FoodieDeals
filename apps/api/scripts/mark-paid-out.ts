import { PrismaClient } from "@prisma/client";

// Charges settle on the platform account, so restaurant payouts are sent by hand.
// After sending one, run this to mark that restaurant's picked-up orders as paid out:
//   pnpm --filter api run payouts:mark-paid <restaurantId>
const restaurantId = process.argv[2];
if (!restaurantId) {
  throw new Error("Usage: payouts:mark-paid <restaurantId>");
}

const prisma = new PrismaClient();

async function main() {
  const where = { restaurantId, paidOutAt: null, status: "PICKED_UP" as const };
  const owed = await prisma.order.aggregate({ where, _sum: { restaurantReceivesCents: true } });
  const { count } = await prisma.order.updateMany({ where, data: { paidOutAt: new Date() } });
  const amount = ((owed._sum.restaurantReceivesCents ?? 0) / 100).toFixed(2);
  console.log(`Marked ${count} order(s) for ${restaurantId} as paid out ($${amount}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

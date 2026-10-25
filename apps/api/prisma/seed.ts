import { SEED_RESTAURANTS, type Deal } from "@foodiedeals/shared";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function dealColumns(deal: Deal) {
  switch (deal.type) {
    case "PERCENT_OFF":
      return { percent: deal.percent, eligibleItemIds: deal.conditions.eligibleItemIds };
    case "BOGO":
      return { eligibleItemIds: deal.eligibleItemIds };
    case "FREE_ITEM":
      return { freeItemId: deal.freeItemId, eligibleItemIds: deal.conditions.eligibleItemIds };
    case "FIXED_PRICE_BUNDLE":
      return {
        eligibleItemIds: deal.eligibleItemIds,
        bundleSize: deal.bundleSize,
        bundlePriceCents: deal.bundlePriceCents,
      };
  }
}

async function main() {
  for (const restaurant of SEED_RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      create: {
        id: restaurant.id,
        name: restaurant.name,
        demoKey: restaurant.demoKey,
        cuisine: restaurant.cuisine,
        isOpen: restaurant.isOpen,
        heroPhoto: restaurant.heroPhoto,
        address: restaurant.address,
        phone: restaurant.phone,
      },
      update: {
        name: restaurant.name,
        demoKey: restaurant.demoKey,
        cuisine: restaurant.cuisine,
        isOpen: restaurant.isOpen,
        heroPhoto: restaurant.heroPhoto,
        address: restaurant.address,
        phone: restaurant.phone,
      },
    });

    for (const menuItem of restaurant.menu) {
      await prisma.menuItem.upsert({
        where: { id: menuItem.id },
        create: {
          id: menuItem.id,
          restaurantId: restaurant.id,
          name: menuItem.name,
          priceCents: menuItem.priceCents,
          photo: menuItem.photo,
        },
        update: {
          name: menuItem.name,
          priceCents: menuItem.priceCents,
          photo: menuItem.photo,
        },
      });
    }

    for (const deal of restaurant.deals) {
      await prisma.deal.upsert({
        where: { id: deal.id },
        create: {
          id: deal.id,
          restaurantId: restaurant.id,
          name: deal.name,
          type: deal.type,
          minSubtotalCents: deal.conditions.minSubtotalCents,
          timeWindowStart: deal.conditions.timeWindow?.startMinute,
          timeWindowEnd: deal.conditions.timeWindow?.endMinute,
          firstVisitOnly: deal.conditions.firstVisitOnly,
          ...dealColumns(deal),
        },
        update: {
          name: deal.name,
          type: deal.type,
          minSubtotalCents: deal.conditions.minSubtotalCents,
          timeWindowStart: deal.conditions.timeWindow?.startMinute,
          timeWindowEnd: deal.conditions.timeWindow?.endMinute,
          firstVisitOnly: deal.conditions.firstVisitOnly,
          ...dealColumns(deal),
        },
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

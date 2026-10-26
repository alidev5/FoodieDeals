import {
  computeQuote,
  DEMO_CUSTOMERS,
  SEED_RESTAURANTS,
  type Deal,
  type DemoCustomer,
} from "@foodiedeals/shared";
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
        prepMinutesMin: restaurant.prepMinutesMin,
        prepMinutesMax: restaurant.prepMinutesMax,
        priceLevel: restaurant.priceLevel,
        closesAtMinute: restaurant.closesAtMinute,
      },
      update: {
        name: restaurant.name,
        demoKey: restaurant.demoKey,
        cuisine: restaurant.cuisine,
        isOpen: restaurant.isOpen,
        heroPhoto: restaurant.heroPhoto,
        address: restaurant.address,
        phone: restaurant.phone,
        prepMinutesMin: restaurant.prepMinutesMin,
        prepMinutesMax: restaurant.prepMinutesMax,
        priceLevel: restaurant.priceLevel,
        closesAtMinute: restaurant.closesAtMinute,
      },
    });

    for (const menuItem of restaurant.menu) {
      await prisma.menuItem.upsert({
        where: { id: menuItem.id },
        create: {
          id: menuItem.id,
          restaurantId: restaurant.id,
          name: menuItem.name,
          description: menuItem.description,
          priceCents: menuItem.priceCents,
          photo: menuItem.photo,
        },
        update: {
          name: menuItem.name,
          description: menuItem.description,
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

const DAY_MS = 24 * 60 * 60 * 1000;

// Past orders use high numbers so they never collide with that day's live sequence.
const DEMO_ORDER_NUMBER_BASE = 900;

async function seedDemoCustomer(demo: DemoCustomer) {
  const customer = await prisma.customer.upsert({
    where: { deviceId: demo.deviceId },
    create: { deviceId: demo.deviceId, pickupName: demo.pickupName },
    update: { pickupName: demo.pickupName },
  });

  for (const [index, pastOrder] of demo.pastOrders.entries()) {
    const restaurant = SEED_RESTAURANTS.find(
      (candidate) => candidate.id === pastOrder.restaurantId,
    );
    if (!restaurant) {
      throw new Error(`Demo order references unknown restaurant ${pastOrder.restaurantId}`);
    }
    const lines = pastOrder.items.map(({ menuItemId, quantity }) => {
      const menuItem = restaurant.menu.find((candidate) => candidate.id === menuItemId);
      if (!menuItem) {
        throw new Error(`Demo order references unknown menu item ${menuItemId}`);
      }
      return { menuItem, quantity };
    });

    const today = new Date();
    const orderDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
        pastOrder.daysAgo * DAY_MS,
    );
    const createdAt = new Date(orderDate.getTime() + 18 * 60 * 60 * 1000);
    const quote = computeQuote(
      { restaurantId: restaurant.id, lines },
      restaurant.deals,
      createdAt,
      false,
    );
    const paymentIntentId = `seed_${demo.deviceId}_${index}`;
    const pickedUpAt = new Date(createdAt.getTime() + 20 * 60 * 1000);

    await prisma.order.upsert({
      where: { stripePaymentIntentId: paymentIntentId },
      update: {},
      create: {
        restaurantId: restaurant.id,
        customerId: customer.id,
        orderNumber: DEMO_ORDER_NUMBER_BASE + index,
        orderDate,
        status: "PICKED_UP",
        subtotalCents: quote.subtotalCents,
        discountCents: quote.discountCents,
        taxCents: quote.taxCents,
        totalCents: quote.totalCents,
        platformFeeCents: quote.platformFeeCents,
        restaurantReceivesCents: quote.restaurantReceivesCents,
        appliedDealId: quote.appliedDeal?.dealId ?? null,
        appliedDealName: quote.appliedDeal?.dealName ?? null,
        stripePaymentIntentId: paymentIntentId,
        createdAt,
        acceptedAt: new Date(createdAt.getTime() + 2 * 60 * 1000),
        readyAt: new Date(createdAt.getTime() + 14 * 60 * 1000),
        pickedUpAt,
        paidOutAt: pickedUpAt,
        items: {
          create: lines.map((line) => ({
            menuItemId: line.menuItem.id,
            name: line.menuItem.name,
            priceCents: line.menuItem.priceCents,
            quantity: line.quantity,
          })),
        },
      },
    });
  }
}

async function seedDemoCustomers() {
  for (const demo of DEMO_CUSTOMERS) {
    await seedDemoCustomer(demo);
  }
}

main()
  .then(seedDemoCustomers)
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

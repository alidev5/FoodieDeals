import {
  computeQuote,
  DEMO_CUSTOMERS,
  SEED_RESTAURANTS,
  type Deal,
  type DemoCustomer,
} from "@foodiedeals/shared";

type SqlValue = string | number | boolean | null | undefined | string[];

function literal(value: SqlValue): string {
  if (value === null || value === undefined) return "NULL";
  if (Array.isArray(value)) return `${literal(JSON.stringify(value))}::jsonb`;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${value.replace(/'/g, "''")}'`;
}

function upsert(
  table: string,
  row: Record<string, SqlValue>,
  conflict: string,
  keep: string[] = [],
) {
  const columns = Object.keys(row);
  const updates = columns
    .filter((column) => column !== "id" && !keep.includes(column))
    .map((column) => `"${column}" = EXCLUDED."${column}"`);
  return (
    `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")})\n` +
    `VALUES (${columns.map((column) => literal(row[column])).join(", ")})\n` +
    `ON CONFLICT (${conflict}) DO ${updates.length ? `UPDATE SET ${updates.join(", ")}` : "NOTHING"};`
  );
}

function dealColumns(deal: Deal): Record<string, SqlValue> {
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

function catalogStatements(): string[] {
  return SEED_RESTAURANTS.flatMap((restaurant) => [
    `-- ${restaurant.name}`,
    upsert(
      "Restaurant",
      {
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
      '"id"',
      // Open/paused is the restaurant's live choice; a re-seed shouldn't flip it back.
      ["isOpen"],
    ),
    ...restaurant.menu.map((item) =>
      upsert(
        "MenuItem",
        {
          id: item.id,
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          photo: item.photo,
        },
        '"id"',
      ),
    ),
    ...restaurant.deals.map((deal) =>
      upsert(
        "Deal",
        {
          id: deal.id,
          restaurantId: restaurant.id,
          name: deal.name,
          type: deal.type,
          percent: null,
          freeItemId: null,
          bundleSize: null,
          bundlePriceCents: null,
          eligibleItemIds: null,
          minSubtotalCents: deal.conditions.minSubtotalCents,
          timeWindowStart: deal.conditions.timeWindow?.startMinute,
          timeWindowEnd: deal.conditions.timeWindow?.endMinute,
          firstVisitOnly: deal.conditions.firstVisitOnly,
          ...dealColumns(deal),
        },
        '"id"',
      ),
    ),
  ]);
}

// Past orders use high numbers so they never collide with that day's live sequence.
const DEMO_ORDER_NUMBER_BASE = 900;

function demoCustomerStatements(demo: DemoCustomer): string[] {
  const statements = [
    `-- Demo customer ${demo.pickupName}`,
    upsert("Customer", { deviceId: demo.deviceId, pickupName: demo.pickupName }, '"deviceId"'),
  ];

  for (const [index, pastOrder] of demo.pastOrders.entries()) {
    const restaurant = SEED_RESTAURANTS.find(
      (candidate) => candidate.id === pastOrder.restaurantId,
    );
    if (!restaurant) {
      throw new Error(`Demo order references unknown restaurant ${pastOrder.restaurantId}`);
    }
    const lines = pastOrder.items.map(({ menuItemId, quantity }) => {
      const menuItem = restaurant.menu.find((candidate) => candidate.id === menuItemId);
      if (!menuItem) throw new Error(`Demo order references unknown menu item ${menuItemId}`);
      return { menuItem, quantity };
    });

    // Priced as if placed at 18:00, the same time the order's createdAt is set to below.
    const pricedAt = new Date(Date.UTC(2026, 0, 1, 18));
    const quote = computeQuote(
      { restaurantId: restaurant.id, lines },
      restaurant.deals,
      pricedAt,
      false,
    );
    const orderDate = `(date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' - interval '${pastOrder.daysAgo} days')`;
    const at = (minutes: number) => `${orderDate} + interval '${18 * 60 + minutes} minutes'`;
    const items = lines
      .map(
        (line) =>
          `(${literal(line.menuItem.id)}, ${literal(line.menuItem.name)}, ${line.menuItem.priceCents}, ${line.quantity})`,
      )
      .join(",\n    ");

    statements.push(`WITH inserted AS (
  INSERT INTO "Order" (
    "restaurantId", "customerId", "orderNumber", "orderDate", "status",
    "subtotalCents", "discountCents", "taxCents", "totalCents", "platformFeeCents", "restaurantReceivesCents",
    "appliedDealId", "appliedDealName", "stripePaymentIntentId",
    "createdAt", "acceptedAt", "readyAt", "pickedUpAt", "paidOutAt"
  )
  SELECT ${literal(restaurant.id)}, c."id", ${DEMO_ORDER_NUMBER_BASE + index}, ${orderDate}, 'PICKED_UP',
    ${quote.subtotalCents}, ${quote.discountCents}, ${quote.taxCents}, ${quote.totalCents}, ${quote.platformFeeCents}, ${quote.restaurantReceivesCents},
    ${literal(quote.appliedDeal?.dealId ?? null)}, ${literal(quote.appliedDeal?.dealName ?? null)}, ${literal(`seed_${demo.deviceId}_${index}`)},
    ${at(0)}, ${at(2)}, ${at(14)}, ${at(20)}, ${at(20)}
  FROM "Customer" c WHERE c."deviceId" = ${literal(demo.deviceId)}
  ON CONFLICT ("stripePaymentIntentId") DO NOTHING
  RETURNING "id"
)
INSERT INTO "OrderItem" ("orderId", "menuItemId", "name", "priceCents", "quantity")
SELECT inserted."id", item.* FROM inserted, (VALUES
    ${items}
) AS item("menuItemId", "name", "priceCents", "quantity");`);
  }

  return statements;
}

export function buildSeedSql(): string {
  return [
    "-- Generated by `pnpm --filter api seed:sql` from packages/shared/src/seed. Do not edit by hand.",
    "-- Safe to re-run: every statement is an upsert.",
    "",
    ...catalogStatements(),
    "",
    ...DEMO_CUSTOMERS.flatMap(demoCustomerStatements),
    "",
  ].join("\n");
}

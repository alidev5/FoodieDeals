import {
  dealTypeSchema,
  restaurantSchema,
  type Deal,
  type DealType,
  type MenuItem,
  type Restaurant,
} from "@foodiedeals/shared";
import { Hono } from "hono";

import type { DealRow, MenuItemRow, RestaurantRow, Sql } from "./db";
import { badRequest, notFound } from "./http";

function toConditions(row: DealRow, eligibleItemIds?: string[]) {
  return {
    ...(row.minSubtotalCents !== null ? { minSubtotalCents: row.minSubtotalCents } : {}),
    ...(row.timeWindowStart !== null && row.timeWindowEnd !== null
      ? { timeWindow: { startMinute: row.timeWindowStart, endMinute: row.timeWindowEnd } }
      : {}),
    ...(row.firstVisitOnly !== null ? { firstVisitOnly: row.firstVisitOnly } : {}),
    ...(eligibleItemIds ? { eligibleItemIds } : {}),
  };
}

function toSharedDeal(row: DealRow): Deal {
  const storedEligibleItemIds = row.eligibleItemIds ?? undefined;
  const base = { id: row.id, restaurantId: row.restaurantId, name: row.name };

  switch (row.type) {
    case "PERCENT_OFF":
      return {
        ...base,
        type: "PERCENT_OFF",
        percent: row.percent as number,
        conditions: toConditions(row, storedEligibleItemIds),
      };
    case "BOGO":
      return {
        ...base,
        type: "BOGO",
        eligibleItemIds: storedEligibleItemIds ?? [],
        conditions: toConditions(row),
      };
    case "FREE_ITEM":
      return {
        ...base,
        type: "FREE_ITEM",
        freeItemId: row.freeItemId as string,
        conditions: toConditions(row, storedEligibleItemIds),
      };
    case "FIXED_PRICE_BUNDLE":
      return {
        ...base,
        type: "FIXED_PRICE_BUNDLE",
        eligibleItemIds: storedEligibleItemIds ?? [],
        bundleSize: row.bundleSize as number,
        bundlePriceCents: row.bundlePriceCents as number,
        conditions: toConditions(row),
      };
  }
}

function toSharedMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    priceCents: row.priceCents,
    ...(row.photo ? { photo: row.photo } : {}),
  };
}

function toSharedRestaurant(row: RestaurantRow, menu: MenuItemRow[], deals: DealRow[]) {
  const restaurant: Restaurant = {
    id: row.id,
    name: row.name,
    demoKey: row.demoKey,
    isOpen: row.isOpen,
    cuisine: row.cuisine,
    ...(row.heroPhoto ? { heroPhoto: row.heroPhoto } : {}),
    ...(row.address ? { address: row.address } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.prepMinutesMin !== null ? { prepMinutesMin: row.prepMinutesMin } : {}),
    ...(row.prepMinutesMax !== null ? { prepMinutesMax: row.prepMinutesMax } : {}),
    ...(row.priceLevel !== null ? { priceLevel: row.priceLevel } : {}),
    ...(row.closesAtMinute !== null ? { closesAtMinute: row.closesAtMinute } : {}),
    menu: menu.map(toSharedMenuItem),
    deals: deals.map(toSharedDeal),
  };

  return restaurantSchema.parse(restaurant);
}

async function loadRestaurants(sql: Sql, rows: RestaurantRow[]): Promise<Restaurant[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [menuItems, deals] = await Promise.all([
    sql<MenuItemRow[]>`SELECT * FROM "MenuItem" WHERE "restaurantId" IN ${sql(ids)}`,
    sql<DealRow[]>`SELECT * FROM "Deal" WHERE "restaurantId" IN ${sql(ids)}`,
  ]);

  return rows.map((row) =>
    toSharedRestaurant(
      row,
      menuItems.filter((item) => item.restaurantId === row.id),
      deals.filter((deal) => deal.restaurantId === row.id),
    ),
  );
}

export function createRestaurantsRepository(sql: Sql) {
  return {
    async list(dealType?: DealType): Promise<Restaurant[]> {
      const rows = dealType
        ? await sql<RestaurantRow[]>`
            SELECT * FROM "Restaurant" r
            WHERE EXISTS (SELECT 1 FROM "Deal" d WHERE d."restaurantId" = r."id" AND d."type" = ${dealType})
            ORDER BY r."name"`
        : await sql<RestaurantRow[]>`SELECT * FROM "Restaurant" ORDER BY "name"`;
      return loadRestaurants(sql, rows);
    },

    async getById(id: string): Promise<Restaurant | null> {
      const rows = await sql<RestaurantRow[]>`SELECT * FROM "Restaurant" WHERE "id" = ${id}`;
      const [restaurant] = await loadRestaurants(sql, rows);
      return restaurant ?? null;
    },
  };
}

export type RestaurantsRepository = ReturnType<typeof createRestaurantsRepository>;

export function restaurantRoutes(restaurants: RestaurantsRepository) {
  return new Hono()
    .get("/", async (c) => {
      const dealType = c.req.query("dealType");
      if (dealType === undefined) {
        return c.json(await restaurants.list());
      }

      const parsed = dealTypeSchema.safeParse(dealType);
      if (!parsed.success) {
        throw badRequest(`Invalid dealType: ${dealType}`);
      }
      return c.json(await restaurants.list(parsed.data));
    })
    .get("/:id", async (c) => {
      const id = c.req.param("id");
      const restaurant = await restaurants.getById(id);
      if (!restaurant) {
        throw notFound(`Restaurant ${id} not found`);
      }
      return c.json(restaurant);
    });
}

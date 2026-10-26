import { restaurantSchema, type Deal, type MenuItem, type Restaurant } from "@foodiedeals/shared";
import type {
  Deal as DealRow,
  MenuItem as MenuItemRow,
  Restaurant as RestaurantRow,
} from "@prisma/client";

type RestaurantWithRelations = RestaurantRow & {
  menuItems: MenuItemRow[];
  deals: DealRow[];
};

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
  const storedEligibleItemIds = (row.eligibleItemIds as string[] | null) ?? undefined;

  switch (row.type) {
    case "PERCENT_OFF":
      return {
        id: row.id,
        restaurantId: row.restaurantId,
        name: row.name,
        type: "PERCENT_OFF",
        percent: row.percent as number,
        conditions: toConditions(row, storedEligibleItemIds),
      };
    case "BOGO":
      return {
        id: row.id,
        restaurantId: row.restaurantId,
        name: row.name,
        type: "BOGO",
        eligibleItemIds: storedEligibleItemIds ?? [],
        conditions: toConditions(row),
      };
    case "FREE_ITEM":
      return {
        id: row.id,
        restaurantId: row.restaurantId,
        name: row.name,
        type: "FREE_ITEM",
        freeItemId: row.freeItemId as string,
        conditions: toConditions(row, storedEligibleItemIds),
      };
    case "FIXED_PRICE_BUNDLE":
      return {
        id: row.id,
        restaurantId: row.restaurantId,
        name: row.name,
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

export function toSharedRestaurant(row: RestaurantWithRelations): Restaurant {
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
    menu: row.menuItems.map(toSharedMenuItem),
    deals: row.deals.map(toSharedDeal),
  };

  return restaurantSchema.parse(restaurant);
}

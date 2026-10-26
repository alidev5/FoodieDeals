import {
  SEED_RESTAURANTS,
  addLine,
  computeQuote,
  createEmptyCart,
  type MenuItem,
  type OrderStatus,
} from "@foodiedeals/shared";

import type { RestaurantOrder } from "../../../lib/restaurantApi";

const misoEmber = SEED_RESTAURANTS.find((restaurant) => restaurant.id === "miso-ember");
if (!misoEmber) throw new Error("fixture restaurant missing");

function findItem(id: string): MenuItem {
  const item = misoEmber!.menu.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`fixture item ${id} missing`);
  return item;
}

function buildOrder(
  id: string,
  orderNumber: number,
  pickupName: string,
  status: OrderStatus,
  minutesAgo: number,
  itemIds: string[],
): RestaurantOrder {
  let cart = createEmptyCart();
  const items = itemIds.map(findItem);
  for (const item of items) {
    cart = addLine(cart, item);
  }

  const quote = computeQuote(cart, misoEmber!.deals, new Date(), false);
  const createdAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();

  return {
    id,
    restaurantId: misoEmber!.id,
    orderNumber,
    pickupName,
    status,
    createdAt,
    acceptedAt: status === "WAITING" ? null : createdAt,
    readyAt: status === "READY" || status === "PICKED_UP" ? createdAt : null,
    pickedUpAt: status === "PICKED_UP" ? createdAt : null,
    paidOutAt: null,
    items: items.map((item) => ({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      priceCents: item.priceCents,
    })),
    appliedDealId: quote.appliedDeal?.dealId ?? null,
    appliedDealName: quote.appliedDeal?.dealName ?? null,
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
    platformFeeCents: quote.platformFeeCents,
    restaurantReceivesCents: quote.restaurantReceivesCents,
  };
}

export const RESTAURANT_ORDERS_FIXTURE: RestaurantOrder[] = [
  buildOrder("order-1", 12, "Hamza M.", "WAITING", 2, ["miso-ramen", "crispy-pork-gyoza"]),
  buildOrder("order-2", 13, "Priya S.", "WAITING", 1, ["chili-sesame-noodles"]),
  buildOrder("order-3", 11, "Devon R.", "ACCEPTED", 6, ["miso-ramen", "matcha-cheesecake"]),
  buildOrder("order-4", 10, "Jae K.", "READY", 11, ["crispy-pork-gyoza", "chili-sesame-noodles"]),
  buildOrder("order-5", 9, "Alex T.", "PICKED_UP", 40, ["miso-ramen"]),
  buildOrder("order-6", 8, "Sam W.", "PICKED_UP", 55, [
    "chili-sesame-noodles",
    "matcha-cheesecake",
  ]),
];

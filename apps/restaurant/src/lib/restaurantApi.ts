import type { OrderStatus } from "@foodiedeals/shared";
import { joinApiUrl } from "@foodiedeals/ui-native";

import { API_URL } from "./apiUrl";

export interface RestaurantOrder {
  id: string;
  restaurantId: string;
  orderNumber: number;
  status: OrderStatus;
  pickupName: string;
  createdAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  /** Set once FoodieDeals has paid the restaurant its share for this order. */
  paidOutAt: string | null;
  items: Array<{ menuItemId: string; name: string; priceCents: number; quantity: number }>;
  appliedDealId: string | null;
  appliedDealName: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  platformFeeCents: number;
  restaurantReceivesCents: number;
}

export interface RestaurantStats {
  active: number;
  ready: number;
  doneToday: number;
  ordersToday: number;
  ordersYesterday: number;
  salesTodayCents: number;
  salesYesterdayCents: number;
  newCustomersToday: number;
  newCustomersYesterday: number;
  avgPrepMinutesToday: number | null;
  avgPrepMinutesYesterday: number | null;
  /** The restaurant's share (after the platform fee) of today's orders. */
  earnedTodayCents: number;
  /** The restaurant's share of every order FoodieDeals hasn't paid out yet. */
  owedCents: number;
  owedOrderCount: number;
}

class RestaurantApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, demoKey: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(joinApiUrl(API_URL, path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-restaurant-key": demoKey,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new RestaurantApiError(response.status, body || response.statusText);
  }

  return (await response.json()) as T;
}

export function listOrders(restaurantId: string, demoKey: string, status?: OrderStatus) {
  const query = status ? `?status=${status}` : "";
  return request<RestaurantOrder[]>(`/restaurants/${restaurantId}/orders${query}`, demoKey);
}

export function getStats(restaurantId: string, demoKey: string) {
  return request<RestaurantStats>(`/restaurants/${restaurantId}/stats`, demoKey);
}

export function setAvailability(restaurantId: string, demoKey: string, isOpen: boolean) {
  return request<{ restaurantId: string; isOpen: boolean }>(
    `/restaurants/${restaurantId}/availability`,
    demoKey,
    {
      method: "PATCH",
      body: JSON.stringify({ isOpen }),
    },
  );
}

export type OrderAction = "ACCEPT" | "MARK_READY" | "PICKED_UP";

export function applyOrderAction(orderId: string, demoKey: string, action: OrderAction) {
  return request<RestaurantOrder>(`/orders/${orderId}/actions`, demoKey, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

import type { OrderStatus } from "@foodiedeals/shared";

import { API_URL } from "./apiUrl";

export interface RestaurantOrder {
  id: string;
  restaurantId: string;
  orderNumber: number;
  status: OrderStatus;
  pickupName: string;
  createdAt: string;
  items: Array<{ name: string; priceCents: number; quantity: number }>;
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
  completedToday: number;
  revenueTodayCents: number;
}

class RestaurantApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, demoKey: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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
  return request<{ restaurantId: string; isOpen: boolean }>(`/restaurants/${restaurantId}/availability`, demoKey, {
    method: "PATCH",
    body: JSON.stringify({ isOpen }),
  });
}

export type OrderAction = "ACCEPT" | "MARK_READY" | "PICKED_UP";

export function applyOrderAction(orderId: string, demoKey: string, action: OrderAction) {
  return request<RestaurantOrder>(`/orders/${orderId}/actions`, demoKey, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

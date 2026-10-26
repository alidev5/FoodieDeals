import { apiClient } from "../../../lib/apiClient";
import type { OrderResponse } from "../../orders/api/ordersApi";

export interface CustomerSummary {
  savedThisMonthCents: number;
  savedLastMonthCents: number;
  pickupsThisMonth: number;
  /** Discount per order this month, oldest first. */
  savingsThisMonthCents: number[];
  recentRestaurants: Array<{ restaurantId: string; lastOrderId: string; lastOrderedAt: string }>;
}

export function getCustomerSummary(deviceId: string): Promise<CustomerSummary> {
  return apiClient.get<CustomerSummary>(`/customers/${encodeURIComponent(deviceId)}/summary`);
}

export function listMyOrders(deviceId: string): Promise<OrderResponse[]> {
  return apiClient.get<OrderResponse[]>(`/orders?deviceId=${encodeURIComponent(deviceId)}`);
}

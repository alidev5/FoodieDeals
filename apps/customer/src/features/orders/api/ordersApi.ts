import type { OrderStatus } from "@foodiedeals/shared";

import { apiClient } from "../../../lib/apiClient";

export interface OrderResponse {
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
  restaurant: { name: string; address: string | null; phone: string | null };
}

export async function getOrder(orderId: string, deviceId: string): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(`/orders/${orderId}?deviceId=${encodeURIComponent(deviceId)}`);
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(`/orders/by-payment-intent/${paymentIntentId}`);
}

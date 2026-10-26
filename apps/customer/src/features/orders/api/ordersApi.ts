import type { OrderStatus } from "@foodiedeals/shared";

import { apiClient } from "../../../lib/apiClient";

export interface OrderResponse {
  id: string;
  restaurantId: string;
  orderNumber: number;
  status: OrderStatus;
  pickupName: string;
  createdAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  items: Array<{ menuItemId: string; name: string; priceCents: number; quantity: number }>;
  appliedDealId: string | null;
  appliedDealName: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  platformFeeCents: number;
  restaurantReceivesCents: number;
  restaurant: {
    name: string;
    address: string | null;
    phone: string | null;
    heroPhoto: string | null;
    prepMinutesMin: number | null;
    prepMinutesMax: number | null;
  };
}

export async function getOrder(orderId: string, deviceId: string): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(
    `/orders/${orderId}?deviceId=${encodeURIComponent(deviceId)}`,
  );
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(`/orders/by-payment-intent/${paymentIntentId}`);
}

/** Resolves the order for a paid intent, creating it from Stripe's record if the webhook is late. */
export async function syncPaymentIntent(paymentIntentId: string): Promise<OrderResponse> {
  return apiClient.post<OrderResponse>(`/payments/intents/${paymentIntentId}/sync`);
}

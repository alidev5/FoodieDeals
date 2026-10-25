import type { Quote } from "@foodiedeals/shared";

import { apiClient } from "../../../lib/apiClient";

export interface CreatePaymentIntentRequest {
  restaurantId: string;
  deviceId: string;
  pickupName: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  quote: Quote;
}

export async function createPaymentIntent(
  request: CreatePaymentIntentRequest,
): Promise<CreatePaymentIntentResponse> {
  return apiClient.post<CreatePaymentIntentResponse>("/checkout/payment-intent", request);
}

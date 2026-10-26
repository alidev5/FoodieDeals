export const STRIPE_CLIENT = "STRIPE_CLIENT";

/**
 * Every charge settles on the platform account. Restaurants are paid their share
 * manually for now (tracked by Order.paidOutAt), not through a Connect transfer.
 */
export interface CreatePaymentIntentParams {
  amountCents: number;
  metadata: Record<string, string>;
}

export interface CreatedPaymentIntent {
  id: string;
  clientSecret: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      metadata?: Record<string, string>;
    };
  };
}

export interface RetrievedPaymentIntent {
  id: string;
  status: string;
  metadata: Record<string, string>;
}

export interface StripeClient {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatedPaymentIntent>;
  retrievePaymentIntent(paymentIntentId: string): Promise<RetrievedPaymentIntent>;
  constructWebhookEvent(rawBody: Buffer, signature: string): StripeWebhookEvent;
}

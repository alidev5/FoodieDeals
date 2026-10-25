export const STRIPE_CLIENT = "STRIPE_CLIENT";

export interface CreatePaymentIntentParams {
  amountCents: number;
  applicationFeeCents: number;
  destinationAccountId: string;
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

export interface StripeClient {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatedPaymentIntent>;
  constructWebhookEvent(rawBody: Buffer, signature: string): StripeWebhookEvent;
}

import Stripe from "stripe";

import type {
  CreatePaymentIntentParams,
  CreatedPaymentIntent,
  StripeClient,
  StripeWebhookEvent,
} from "./stripe-client";

export class RealStripeClient implements StripeClient {
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatedPaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: "usd",
      application_fee_amount: params.applicationFeeCents,
      transfer_data: { destination: params.destinationAccountId },
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }

    return { id: intent.id, clientSecret: intent.client_secret };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): StripeWebhookEvent {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    ) as unknown as StripeWebhookEvent;
  }
}

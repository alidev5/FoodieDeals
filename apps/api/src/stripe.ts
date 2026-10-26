import Stripe from "stripe";

import { unavailable } from "./http";

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
  constructWebhookEvent(rawBody: string, signature: string): Promise<StripeWebhookEvent>;
}

/** Uses fetch and WebCrypto so the same client runs under Node and Supabase's Deno runtime. */
export function createStripeClient(secretKey: string, webhookSecret: string): StripeClient {
  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  return {
    async createPaymentIntent(params) {
      const intent = await stripe.paymentIntents
        .create({
          amount: params.amountCents,
          currency: "usd",
          metadata: params.metadata,
          automatic_payment_methods: { enabled: true },
        })
        .catch((error: unknown) => {
          // A missing or wrong STRIPE_SECRET_KEY, e.g. a local run that hasn't set one yet.
          if (error instanceof Stripe.errors.StripeAuthenticationError) {
            throw unavailable(
              "Payments aren't set up on this server yet. Add your Stripe test keys (see the README).",
            );
          }
          throw error;
        });

      if (!intent.client_secret) {
        throw new Error("Stripe did not return a client secret");
      }
      return { id: intent.id, clientSecret: intent.client_secret };
    },

    async retrievePaymentIntent(paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return { id: intent.id, status: intent.status, metadata: intent.metadata };
    },

    async constructWebhookEvent(rawBody, signature) {
      const event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
      return event as unknown as StripeWebhookEvent;
    },
  };
}

import { Hono } from "hono";

import { badRequest, notFound } from "./http";
import type { OrderResponse, OrdersService } from "./orders";
import { paymentIntentMetadataSchema } from "./paymentIntentMetadata";
import type { StripeClient } from "./stripe";

export function createPaymentsService(stripe: StripeClient, orders: OrdersService) {
  return {
    async handleWebhook(rawBody: string, signature: string): Promise<void> {
      const event = await stripe.constructWebhookEvent(rawBody, signature).catch(() => {
        throw badRequest("Invalid Stripe signature");
      });

      switch (event.type) {
        case "payment_intent.succeeded": {
          const metadata = paymentIntentMetadataSchema.parse(event.data.object.metadata ?? {});
          await orders.createFromPaymentIntent(event.id, event.data.object.id, metadata);
          break;
        }
        case "payment_intent.payment_failed":
          await orders.markPaymentFailed(event.id, event.data.object.id);
          break;
        default:
          console.log(`Ignoring unhandled Stripe event type: ${event.type}`);
      }
    },

    /**
     * Covers a webhook that hasn't arrived (or can't reach this host): asks Stripe directly
     * whether the intent succeeded and creates the order through the same idempotent path.
     */
    async syncPaymentIntent(paymentIntentId: string): Promise<OrderResponse> {
      const existing = await orders.getByPaymentIntentId(paymentIntentId);
      if (existing) return existing;

      const intent = await stripe.retrievePaymentIntent(paymentIntentId).catch((error: unknown) => {
        console.warn(`Could not retrieve ${paymentIntentId} from Stripe: ${String(error)}`);
        throw notFound("Payment not found");
      });
      if (intent.status !== "succeeded") {
        throw notFound(`Payment is ${intent.status.replace(/_/g, " ")}`);
      }

      const metadata = paymentIntentMetadataSchema.parse(intent.metadata);
      await orders.createFromPaymentIntent(`sync:${intent.id}`, intent.id, metadata);

      const order = await orders.getByPaymentIntentId(paymentIntentId);
      if (!order) throw notFound("Order not created yet");
      return order;
    },
  };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;

export function paymentRoutes(payments: PaymentsService) {
  return new Hono()
    .post("/webhook", async (c) => {
      const signature = c.req.header("stripe-signature");
      const rawBody = await c.req.text();
      if (!rawBody || !signature) {
        throw badRequest("Missing Stripe signature or body");
      }
      await payments.handleWebhook(rawBody, signature);
      return c.json({ received: true });
    })
    .post("/intents/:paymentIntentId/sync", async (c) =>
      c.json(await payments.syncPaymentIntent(c.req.param("paymentIntentId"))),
    );
}

import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { paymentIntentMetadataSchema } from "../checkout/payment-intent-metadata";
import type { OrderResponse } from "../orders/orders.mapper";
import { OrdersService } from "../orders/orders.service";

import { STRIPE_CLIENT, type StripeClient } from "./stripe-client";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: StripeClient,
    private readonly ordersService: OrdersService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event;
    try {
      event = this.stripeClient.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException("Invalid Stripe signature");
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const metadata = paymentIntentMetadataSchema.parse(event.data.object.metadata ?? {});
        await this.ordersService.createFromPaymentIntent(event.id, event.data.object.id, metadata);
        break;
      }
      case "payment_intent.payment_failed": {
        await this.ordersService.markPaymentFailed(event.id, event.data.object.id);
        break;
      }
      default:
        this.logger.log(`Ignoring unhandled Stripe event type: ${event.type}`);
    }
  }

  /**
   * Covers a webhook that hasn't arrived (or can't reach this host): asks Stripe directly
   * whether the intent succeeded and creates the order through the same idempotent path.
   */
  async syncPaymentIntent(paymentIntentId: string): Promise<OrderResponse> {
    const existing = await this.ordersService.getByPaymentIntentId(paymentIntentId);
    if (existing) {
      return existing;
    }

    const intent = await this.stripeClient
      .retrievePaymentIntent(paymentIntentId)
      .catch((error: unknown) => {
        this.logger.warn(`Could not retrieve ${paymentIntentId} from Stripe: ${String(error)}`);
        throw new NotFoundException("Payment not found");
      });
    if (intent.status !== "succeeded") {
      throw new NotFoundException(`Payment is ${intent.status.replace(/_/g, " ")}`);
    }

    const metadata = paymentIntentMetadataSchema.parse(intent.metadata);
    await this.ordersService.createFromPaymentIntent(`sync:${intent.id}`, intent.id, metadata);

    const order = await this.ordersService.getByPaymentIntentId(paymentIntentId);
    if (!order) {
      throw new NotFoundException("Order not created yet");
    }
    return order;
  }
}

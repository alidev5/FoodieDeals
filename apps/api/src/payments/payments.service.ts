import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";

import { paymentIntentMetadataSchema } from "../checkout/payment-intent-metadata";
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
}

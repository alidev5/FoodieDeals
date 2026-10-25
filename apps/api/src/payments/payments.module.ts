import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../config/env.schema";
import { OrdersModule } from "../orders/orders.module";

import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RealStripeClient } from "./real-stripe-client";
import { STRIPE_CLIENT } from "./stripe-client";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: STRIPE_CLIENT,
      useFactory: (config: ConfigService<Env, true>) =>
        new RealStripeClient(
          config.get("STRIPE_SECRET_KEY", { infer: true }),
          config.get("STRIPE_WEBHOOK_SECRET", { infer: true }),
        ),
      inject: [ConfigService],
    },
  ],
  exports: [STRIPE_CLIENT],
})
export class PaymentsModule {}

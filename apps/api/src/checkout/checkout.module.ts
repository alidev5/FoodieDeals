import { Module } from "@nestjs/common";

import { PaymentsModule } from "../payments/payments.module";
import { RestaurantsModule } from "../restaurants/restaurants.module";

import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [RestaurantsModule, PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}

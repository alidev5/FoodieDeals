import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { CheckoutModule } from "./checkout/checkout.module";
import { ConfigModule } from "./config/config.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthModule } from "./health/health.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    RestaurantsModule,
    CustomersModule,
    HealthModule,
    RealtimeModule,
    OrdersModule,
    PaymentsModule,
    CheckoutModule,
  ],
})
export class AppModule {}

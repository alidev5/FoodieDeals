import { Module } from "@nestjs/common";

import { RestaurantKeyGuard } from "../common/guards/restaurant-key.guard";

import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { RestaurantOrdersController } from "./restaurant-orders.controller";

@Module({
  controllers: [OrdersController, RestaurantOrdersController],
  providers: [OrdersService, RestaurantKeyGuard],
  exports: [OrdersService],
})
export class OrdersModule {}

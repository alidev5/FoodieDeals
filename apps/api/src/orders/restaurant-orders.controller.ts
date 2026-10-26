import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";

import { RestaurantKeyGuard } from "../common/guards/restaurant-key.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { orderStatusQuerySchema, setAvailabilitySchema } from "./orders.dto";
import { OrdersService } from "./orders.service";

@ApiTags("restaurant-orders")
@ApiSecurity("restaurant-key")
@UseGuards(RestaurantKeyGuard)
@Controller("restaurants/:restaurantId")
export class RestaurantOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("orders")
  @ApiOperation({ summary: "List a restaurant's orders, optionally filtered by status" })
  @ApiOkResponse({ description: "Matching orders, newest first" })
  async list(
    @Param("restaurantId") restaurantId: string,
    @Query(new ZodValidationPipe(orderStatusQuerySchema))
    query: ReturnType<typeof orderStatusQuerySchema.parse>,
  ) {
    return this.ordersService.listForRestaurant(restaurantId, query.status);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get live order stats for a restaurant" })
  @ApiOkResponse({ description: "Active, ready, completed and revenue counts" })
  async stats(@Param("restaurantId") restaurantId: string) {
    return this.ordersService.getStats(restaurantId);
  }

  @Patch("availability")
  @ApiOperation({ summary: "Open or pause a restaurant" })
  @ApiOkResponse({ description: "The restaurant's new availability" })
  async setAvailability(
    @Param("restaurantId") restaurantId: string,
    @Body(new ZodValidationPipe(setAvailabilitySchema))
    body: ReturnType<typeof setAvailabilitySchema.parse>,
  ) {
    return this.ordersService.setAvailability(restaurantId, body.isOpen);
  }
}

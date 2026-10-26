import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { orderActionSchema } from "./orders.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "List the requesting device's orders, newest first" })
  @ApiOkResponse({ description: "Up to 50 of the device's most recent orders" })
  async listForDevice(@Query("deviceId") deviceId?: string) {
    if (!deviceId) {
      throw new BadRequestException("deviceId is required");
    }
    return this.ordersService.listForDevice(deviceId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an order, scoped to the requesting device" })
  @ApiOkResponse({ description: "The order" })
  async getById(@Param("id") id: string, @Query("deviceId") deviceId?: string) {
    if (!deviceId) {
      throw new BadRequestException("deviceId is required");
    }
    return this.ordersService.getById(id, deviceId);
  }

  @Get("by-payment-intent/:paymentIntentId")
  @ApiOperation({ summary: "Resolve an order by Stripe payment intent id" })
  @ApiOkResponse({ description: "The order, once the webhook has created it" })
  async getByPaymentIntentId(@Param("paymentIntentId") paymentIntentId: string) {
    const order = await this.ordersService.getByPaymentIntentId(paymentIntentId);
    if (!order) {
      throw new NotFoundException("Order not created yet");
    }
    return order;
  }

  @Patch(":id/actions")
  @ApiOperation({ summary: "Advance an order's status (restaurant only)" })
  @ApiOkResponse({ description: "The updated order" })
  async applyAction(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(orderActionSchema))
    body: ReturnType<typeof orderActionSchema.parse>,
    @Headers("x-restaurant-key") demoKey?: string,
  ) {
    return this.ordersService.applyAction(id, body.action, demoKey);
  }
}

import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request } from "express";

import { PaymentsService } from "./payments.service";

@ApiExcludeController()
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string,
  ) {
    if (!request.rawBody || !signature) {
      throw new BadRequestException("Missing Stripe signature or body");
    }

    await this.paymentsService.handleWebhook(request.rawBody, signature);
    return { received: true };
  }

  @Post("intents/:paymentIntentId/sync")
  @HttpCode(200)
  async sync(@Param("paymentIntentId") paymentIntentId: string) {
    return this.paymentsService.syncPaymentIntent(paymentIntentId);
  }
}

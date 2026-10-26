import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { createPaymentIntentRequestSchema, quoteRequestSchema } from "./checkout.dto";
import { CheckoutService } from "./checkout.service";

@ApiTags("checkout")
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("quote")
  @ApiOperation({ summary: "Price a cart server-side" })
  @ApiOkResponse({ description: "The computed quote" })
  @UsePipes(new ZodValidationPipe(quoteRequestSchema))
  async quote(@Body() body: ReturnType<typeof quoteRequestSchema.parse>) {
    return this.checkoutService.quote(body);
  }

  @Post("payment-intent")
  @ApiOperation({ summary: "Create a Stripe payment intent for a cart" })
  @ApiCreatedResponse({ description: "Client secret and quote" })
  @UsePipes(new ZodValidationPipe(createPaymentIntentRequestSchema))
  async createPaymentIntent(
    @Body() body: ReturnType<typeof createPaymentIntentRequestSchema.parse>,
  ) {
    return this.checkoutService.createPaymentIntent(body);
  }
}

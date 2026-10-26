import {
  addLine,
  computeQuote,
  createEmptyCart,
  type Cart,
  type Quote,
  type Restaurant,
} from "@foodiedeals/shared";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { STRIPE_CLIENT, type StripeClient } from "../payments/stripe-client";
import { PrismaService } from "../prisma/prisma.service";
import { RestaurantsService } from "../restaurants/restaurants.service";

import type { CreatePaymentIntentRequestDto, QuoteRequestDto } from "./checkout.dto";
import { encodePaymentIntentMetadata, type OrderLineMetadata } from "./payment-intent-metadata";

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  quote: Quote;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly prisma: PrismaService,
    @Inject(STRIPE_CLIENT) private readonly stripeClient: StripeClient,
  ) {}

  private buildCart(restaurant: Restaurant, items: QuoteRequestDto["items"]): Cart {
    let cart = createEmptyCart();
    for (const requested of items) {
      const menuItem = restaurant.menu.find((candidate) => candidate.id === requested.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(
          `Menu item ${requested.menuItemId} does not belong to restaurant ${restaurant.id}`,
        );
      }
      cart = addLine(cart, menuItem, requested.quantity);
    }
    return cart;
  }

  private async getRestaurantOrThrow(restaurantId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsService.getById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }
    return restaurant;
  }

  private async isFirstVisit(deviceId: string, restaurantId: string): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({ where: { deviceId } });
    if (!customer) return true;

    const priorOrder = await this.prisma.order.findFirst({
      where: { customerId: customer.id, restaurantId },
      select: { id: true },
    });
    return !priorOrder;
  }

  async quote(request: QuoteRequestDto): Promise<Quote> {
    const restaurant = await this.getRestaurantOrThrow(request.restaurantId);
    const cart = this.buildCart(restaurant, request.items);
    const isFirstVisit = await this.isFirstVisit(request.deviceId, request.restaurantId);
    return computeQuote(cart, restaurant.deals, new Date(), isFirstVisit);
  }

  async createPaymentIntent(request: CreatePaymentIntentRequestDto): Promise<PaymentIntentResult> {
    const restaurant = await this.getRestaurantOrThrow(request.restaurantId);

    if (!restaurant.isOpen) {
      throw new ConflictException(
        `${restaurant.name} is paused and isn't accepting orders right now`,
      );
    }

    const cart = this.buildCart(restaurant, request.items);
    const isFirstVisit = await this.isFirstVisit(request.deviceId, request.restaurantId);
    const quote = computeQuote(cart, restaurant.deals, new Date(), isFirstVisit);

    await this.prisma.customer.upsert({
      where: { deviceId: request.deviceId },
      create: { deviceId: request.deviceId, pickupName: request.pickupName },
      update: { pickupName: request.pickupName },
    });

    const items: OrderLineMetadata[] = cart.lines.map((line) => ({
      menuItemId: line.menuItem.id,
      name: line.menuItem.name,
      priceCents: line.menuItem.priceCents,
      quantity: line.quantity,
    }));

    const metadata = encodePaymentIntentMetadata({
      restaurantId: restaurant.id,
      deviceId: request.deviceId,
      pickupName: request.pickupName,
      items,
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      platformFeeCents: quote.platformFeeCents,
      restaurantReceivesCents: quote.restaurantReceivesCents,
      appliedDealId: quote.appliedDeal?.dealId ?? "",
      appliedDealName: quote.appliedDeal?.dealName ?? "",
    });

    const intent = await this.stripeClient.createPaymentIntent({
      amountCents: quote.totalCents,
      metadata,
    });

    await this.prisma.checkoutSession.create({
      data: {
        restaurantId: restaurant.id,
        deviceId: request.deviceId,
        stripePaymentIntentId: intent.id,
        status: "created",
      },
    });

    return { clientSecret: intent.clientSecret, paymentIntentId: intent.id, quote };
  }
}

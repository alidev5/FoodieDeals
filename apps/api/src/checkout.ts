import {
  addLine,
  computeQuote,
  createEmptyCart,
  type Cart,
  type Quote,
  type Restaurant,
} from "@foodiedeals/shared";
import { Hono } from "hono";
import { z } from "zod";

import { upsertCustomer } from "./customers";
import type { Sql } from "./db";
import { badRequest, conflict, notFound, readJson } from "./http";
import { encodePaymentIntentMetadata, type OrderLineMetadata } from "./paymentIntentMetadata";
import type { RestaurantsRepository } from "./restaurants";
import type { StripeClient } from "./stripe";

const checkoutItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
});

export const quoteRequestSchema = z.object({
  restaurantId: z.string(),
  deviceId: z.string(),
  items: z.array(checkoutItemSchema).min(1),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const createPaymentIntentRequestSchema = quoteRequestSchema.extend({
  pickupName: z.string().min(1).max(80),
});
export type CreatePaymentIntentRequest = z.infer<typeof createPaymentIntentRequestSchema>;

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  quote: Quote;
}

function buildCart(restaurant: Restaurant, items: QuoteRequest["items"]): Cart {
  let cart = createEmptyCart();
  for (const requested of items) {
    const menuItem = restaurant.menu.find((candidate) => candidate.id === requested.menuItemId);
    if (!menuItem) {
      throw badRequest(
        `Menu item ${requested.menuItemId} does not belong to restaurant ${restaurant.id}`,
      );
    }
    cart = addLine(cart, menuItem, requested.quantity);
  }
  return cart;
}

export function createCheckoutService(
  sql: Sql,
  restaurants: RestaurantsRepository,
  stripe: StripeClient,
) {
  async function getRestaurantOrThrow(restaurantId: string): Promise<Restaurant> {
    const restaurant = await restaurants.getById(restaurantId);
    if (!restaurant) {
      throw notFound(`Restaurant ${restaurantId} not found`);
    }
    return restaurant;
  }

  async function isFirstVisit(deviceId: string, restaurantId: string): Promise<boolean> {
    const [prior] = await sql`
      SELECT 1 FROM "Order" o JOIN "Customer" c ON c."id" = o."customerId"
      WHERE c."deviceId" = ${deviceId} AND o."restaurantId" = ${restaurantId}
      LIMIT 1`;
    return !prior;
  }

  return {
    async quote(request: QuoteRequest): Promise<Quote> {
      const restaurant = await getRestaurantOrThrow(request.restaurantId);
      const cart = buildCart(restaurant, request.items);
      const firstVisit = await isFirstVisit(request.deviceId, request.restaurantId);
      return computeQuote(cart, restaurant.deals, new Date(), firstVisit);
    },

    async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResult> {
      const restaurant = await getRestaurantOrThrow(request.restaurantId);
      if (!restaurant.isOpen) {
        throw conflict(`${restaurant.name} is paused and isn't accepting orders right now`);
      }

      const cart = buildCart(restaurant, request.items);
      const firstVisit = await isFirstVisit(request.deviceId, request.restaurantId);
      const quote = computeQuote(cart, restaurant.deals, new Date(), firstVisit);

      await upsertCustomer(sql, request.deviceId, request.pickupName);

      const items: OrderLineMetadata[] = cart.lines.map((line) => ({
        menuItemId: line.menuItem.id,
        name: line.menuItem.name,
        priceCents: line.menuItem.priceCents,
        quantity: line.quantity,
      }));

      const intent = await stripe.createPaymentIntent({
        amountCents: quote.totalCents,
        metadata: encodePaymentIntentMetadata({
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
        }),
      });

      await sql`
        INSERT INTO "CheckoutSession" ("restaurantId", "deviceId", "stripePaymentIntentId", "status")
        VALUES (${restaurant.id}, ${request.deviceId}, ${intent.id}, 'created')`;

      return { clientSecret: intent.clientSecret, paymentIntentId: intent.id, quote };
    },
  };
}

export type CheckoutService = ReturnType<typeof createCheckoutService>;

export function checkoutRoutes(checkout: CheckoutService) {
  return new Hono()
    .post("/quote", async (c) =>
      c.json(await checkout.quote(await readJson(c, quoteRequestSchema)), 201),
    )
    .post("/payment-intent", async (c) =>
      c.json(
        await checkout.createPaymentIntent(await readJson(c, createPaymentIntentRequestSchema)),
        201,
      ),
    );
}

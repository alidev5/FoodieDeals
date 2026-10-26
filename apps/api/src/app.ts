import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createCheckoutService, checkoutRoutes } from "./checkout";
import { customerRoutes } from "./customers";
import type { Sql } from "./db";
import { errorResponse, notFound } from "./http";
import { createOrdersService, orderRoutes, restaurantOrderRoutes } from "./orders";
import { createPaymentsService, paymentRoutes } from "./payments";
import { createRealtimePublisher, type RealtimeSender } from "./realtime";
import { createRestaurantsRepository, restaurantRoutes } from "./restaurants";
import type { StripeClient } from "./stripe";

export interface AppDependencies {
  sql: Sql;
  stripe: StripeClient;
  realtime: RealtimeSender;
}

/** Every route lives under /api, matching the Supabase function's URL: /functions/v1/api/... */
export const API_BASE_PATH = "/api";

export function createApp({ sql, stripe, realtime }: AppDependencies) {
  const restaurants = createRestaurantsRepository(sql);
  const orders = createOrdersService(sql, createRealtimePublisher(realtime));
  const checkout = createCheckoutService(sql, restaurants, stripe);
  const payments = createPaymentsService(stripe, orders);

  return (
    new Hono()
      .basePath(API_BASE_PATH)
      .use(logger())
      // Browsers reuse the preflight answer for 2 hours instead of asking before every request.
      .use(cors({ origin: "*", maxAge: 7200 }))
      .onError(errorResponse)
      .notFound((c) => errorResponse(notFound(`Cannot ${c.req.method} ${c.req.path}`), c))
      .get("/health", async (c) => {
        await sql`SELECT 1`;
        return c.json({ status: "ok" });
      })
      .route("/restaurants", restaurantOrderRoutes(sql, orders))
      .route("/restaurants", restaurantRoutes(restaurants))
      .route("/customers", customerRoutes(sql))
      .route("/checkout", checkoutRoutes(checkout))
      .route("/orders", orderRoutes(orders))
      .route("/payments", paymentRoutes(payments))
  );
}

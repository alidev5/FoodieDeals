import { Hono } from "hono";
import { z } from "zod";

import type { CustomerRow, Sql } from "./db";
import { readJson } from "./http";

const createCustomerSchema = z.object({
  deviceId: z.string().min(1),
  pickupName: z.string().min(1).max(80),
});

const RECENT_RESTAURANT_LIMIT = 6;

function startOfUtcMonth(date: Date, monthOffset = 0): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1));
}

export function upsertCustomer(sql: Sql, deviceId: string, pickupName: string) {
  return sql<CustomerRow[]>`
    INSERT INTO "Customer" ("deviceId", "pickupName") VALUES (${deviceId}, ${pickupName})
    ON CONFLICT ("deviceId") DO UPDATE SET "pickupName" = EXCLUDED."pickupName"
    RETURNING *`.then(([customer]) => customer!);
}

async function getSummary(sql: Sql, deviceId: string) {
  const now = new Date();
  const thisMonth = startOfUtcMonth(now);
  const lastMonth = startOfUtcMonth(now, -1);

  const [orders, recent] = await Promise.all([
    sql<{ discountCents: number; createdAt: Date }[]>`
      SELECT o."discountCents", o."createdAt" FROM "Order" o
      JOIN "Customer" c ON c."id" = o."customerId"
      WHERE c."deviceId" = ${deviceId} AND o."createdAt" >= ${lastMonth}
      ORDER BY o."createdAt" ASC`,
    sql<{ id: string; restaurantId: string; createdAt: Date }[]>`
      SELECT * FROM (
        SELECT DISTINCT ON (o."restaurantId") o."id", o."restaurantId", o."createdAt"
        FROM "Order" o JOIN "Customer" c ON c."id" = o."customerId"
        WHERE c."deviceId" = ${deviceId}
        ORDER BY o."restaurantId", o."createdAt" DESC
      ) latest
      ORDER BY "createdAt" DESC
      LIMIT ${RECENT_RESTAURANT_LIMIT}`,
  ]);

  const thisMonthOrders = orders.filter((order) => order.createdAt >= thisMonth);
  const lastMonthOrders = orders.filter((order) => order.createdAt < thisMonth);

  return {
    savedThisMonthCents: thisMonthOrders.reduce((sum, order) => sum + order.discountCents, 0),
    savedLastMonthCents: lastMonthOrders.reduce((sum, order) => sum + order.discountCents, 0),
    pickupsThisMonth: thisMonthOrders.length,
    savingsThisMonthCents: thisMonthOrders.map((order) => order.discountCents),
    recentRestaurants: recent.map((order) => ({
      restaurantId: order.restaurantId,
      lastOrderId: order.id,
      lastOrderedAt: order.createdAt.toISOString(),
    })),
  };
}

export function customerRoutes(sql: Sql) {
  return new Hono()
    .post("/", async (c) => {
      const body = await readJson(c, createCustomerSchema);
      return c.json(await upsertCustomer(sql, body.deviceId, body.pickupName), 201);
    })
    .get("/:deviceId/summary", async (c) => c.json(await getSummary(sql, c.req.param("deviceId"))));
}

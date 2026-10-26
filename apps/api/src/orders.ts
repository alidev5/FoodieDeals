import { canTransition, type OrderStatus } from "@foodiedeals/shared";
import { Hono, type Context } from "hono";
import { z } from "zod";

import { isUniqueViolation, type Sql } from "./db";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  parseWith,
  readJson,
  unauthorized,
} from "./http";
import type { PaymentIntentMetadata } from "./paymentIntentMetadata";
import type { RealtimePublisher } from "./realtime";

export const orderActionSchema = z.object({
  action: z.enum(["ACCEPT", "MARK_READY", "PICKED_UP"]),
});
type OrderAction = z.infer<typeof orderActionSchema>["action"];

export const setAvailabilitySchema = z.object({ isOpen: z.boolean() });

const orderStatusQuerySchema = z.object({
  status: z.enum(["WAITING", "ACCEPTED", "READY", "PICKED_UP"]).optional(),
});

const ACTION_TO_STATUS: Record<OrderAction, OrderStatus> = {
  ACCEPT: "ACCEPTED",
  MARK_READY: "READY",
  PICKED_UP: "PICKED_UP",
};

const STATUS_TIMESTAMP_COLUMN: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "acceptedAt",
  READY: "readyAt",
  PICKED_UP: "pickedUpAt",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const iso = (date: Date | null) => date?.toISOString() ?? null;

interface OrderJoinRow {
  id: string;
  restaurantId: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: Date;
  acceptedAt: Date | null;
  readyAt: Date | null;
  pickedUpAt: Date | null;
  paidOutAt: Date | null;
  appliedDealId: string | null;
  appliedDealName: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  platformFeeCents: number;
  restaurantReceivesCents: number;
  pickupName: string;
  deviceId: string;
  demoKey: string;
  restaurantName: string;
  restaurantAddress: string | null;
  restaurantPhone: string | null;
  restaurantHeroPhoto: string | null;
  restaurantPrepMinutesMin: number | null;
  restaurantPrepMinutesMax: number | null;
}

interface OrderItemRow {
  orderId: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

function toOrderResponse(order: OrderJoinRow, items: OrderItemRow[]) {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    orderNumber: order.orderNumber,
    status: order.status,
    pickupName: order.pickupName,
    createdAt: order.createdAt.toISOString(),
    acceptedAt: iso(order.acceptedAt),
    readyAt: iso(order.readyAt),
    pickedUpAt: iso(order.pickedUpAt),
    paidOutAt: iso(order.paidOutAt),
    items: items.map((item) => ({
      name: item.name,
      priceCents: item.priceCents,
      quantity: item.quantity,
      menuItemId: item.menuItemId,
    })),
    appliedDealId: order.appliedDealId,
    appliedDealName: order.appliedDealName,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    platformFeeCents: order.platformFeeCents,
    restaurantReceivesCents: order.restaurantReceivesCents,
    restaurant: {
      name: order.restaurantName,
      address: order.restaurantAddress,
      phone: order.restaurantPhone,
      heroPhoto: order.restaurantHeroPhoto,
      prepMinutesMin: order.restaurantPrepMinutesMin,
      prepMinutesMax: order.restaurantPrepMinutesMax,
    },
  };
}

export type OrderResponse = ReturnType<typeof toOrderResponse>;

export async function assertRestaurantKey(
  sql: Sql,
  restaurantId: string | undefined,
  demoKey: string | undefined,
): Promise<void> {
  if (!restaurantId || !demoKey) {
    throw unauthorized("Missing restaurant credentials");
  }

  const [restaurant] = await sql<{ demoKey: string }[]>`
    SELECT "demoKey" FROM "Restaurant" WHERE "id" = ${restaurantId}`;
  if (!restaurant || restaurant.demoKey !== demoKey) {
    throw unauthorized("Invalid restaurant credentials");
  }
}

export function createOrdersService(sql: Sql, realtime: RealtimePublisher) {
  async function selectOrders(filter: ReturnType<Sql>, limit?: number) {
    const rows = await sql<OrderJoinRow[]>`
      SELECT o.*, c."pickupName", c."deviceId", r."demoKey",
        r."name" AS "restaurantName", r."address" AS "restaurantAddress",
        r."phone" AS "restaurantPhone", r."heroPhoto" AS "restaurantHeroPhoto",
        r."prepMinutesMin" AS "restaurantPrepMinutesMin",
        r."prepMinutesMax" AS "restaurantPrepMinutesMax"
      FROM "Order" o
      JOIN "Customer" c ON c."id" = o."customerId"
      JOIN "Restaurant" r ON r."id" = o."restaurantId"
      WHERE ${filter}
      ORDER BY o."createdAt" DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}`;
    if (rows.length === 0) return [];

    const items = await sql<OrderItemRow[]>`
      SELECT * FROM "OrderItem" WHERE "orderId" IN ${sql(rows.map((row) => row.id))}`;
    return rows.map((row) => ({
      row,
      response: toOrderResponse(
        row,
        items.filter((item) => item.orderId === row.id),
      ),
    }));
  }

  async function findOne(filter: ReturnType<Sql>) {
    const [found] = await selectOrders(filter);
    return found ?? null;
  }

  async function dayTotals(restaurantId: string, orderDate: Date) {
    const orders = await sql<
      {
        totalCents: number;
        restaurantReceivesCents: number;
        createdAt: Date;
        readyAt: Date | null;
      }[]
    >`
      SELECT "totalCents", "restaurantReceivesCents", "createdAt", "readyAt" FROM "Order"
      WHERE "restaurantId" = ${restaurantId} AND "orderDate" = ${orderDate}`;

    const prepDurations = orders
      .filter((order) => order.readyAt !== null)
      .map((order) => (order.readyAt as Date).getTime() - order.createdAt.getTime());

    return {
      orders: orders.length,
      salesCents: orders.reduce((sum, order) => sum + order.totalCents, 0),
      earnedCents: orders.reduce((sum, order) => sum + order.restaurantReceivesCents, 0),
      avgPrepMinutes:
        prepDurations.length > 0
          ? Math.round(
              prepDurations.reduce((sum, ms) => sum + ms, 0) / prepDurations.length / 60000,
            )
          : null,
    };
  }

  return {
    async createFromPaymentIntent(
      stripeEventId: string,
      paymentIntentId: string,
      metadata: PaymentIntentMetadata,
    ): Promise<void> {
      try {
        await sql.begin(async (tx) => {
          await tx`
            INSERT INTO "ProcessedStripeEvent" ("id", "type")
            VALUES (${stripeEventId}, 'payment_intent.succeeded')`;

          const [customer] = await tx<{ id: string }[]>`
            INSERT INTO "Customer" ("deviceId", "pickupName")
            VALUES (${metadata.deviceId}, ${metadata.pickupName})
            ON CONFLICT ("deviceId") DO UPDATE SET "pickupName" = EXCLUDED."pickupName"
            RETURNING "id"`;

          const orderDate = startOfUtcDay(new Date());
          const [counter] = await tx<{ lastNumber: number }[]>`
            INSERT INTO "DailyOrderCounter" ("restaurantId", "date", "lastNumber")
            VALUES (${metadata.restaurantId}, ${orderDate}, 1)
            ON CONFLICT ("restaurantId", "date")
            DO UPDATE SET "lastNumber" = "DailyOrderCounter"."lastNumber" + 1
            RETURNING "lastNumber"`;

          const [order] = await tx<{ id: string }[]>`
            INSERT INTO "Order" (
              "restaurantId", "customerId", "orderNumber", "orderDate", "status",
              "subtotalCents", "discountCents", "taxCents", "totalCents",
              "platformFeeCents", "restaurantReceivesCents",
              "appliedDealId", "appliedDealName", "stripePaymentIntentId"
            ) VALUES (
              ${metadata.restaurantId}, ${customer!.id}, ${counter!.lastNumber}, ${orderDate}, 'WAITING',
              ${metadata.subtotalCents}, ${metadata.discountCents}, ${metadata.taxCents}, ${metadata.totalCents},
              ${metadata.platformFeeCents}, ${metadata.restaurantReceivesCents},
              ${metadata.appliedDealId || null}, ${metadata.appliedDealName || null}, ${paymentIntentId}
            ) RETURNING "id"`;

          await tx`
            INSERT INTO "OrderItem" ${tx(
              metadata.items.map((item) => ({
                orderId: order!.id,
                menuItemId: item.menuItemId,
                name: item.name,
                priceCents: item.priceCents,
                quantity: item.quantity,
              })),
            )}`;

          await tx`
            UPDATE "CheckoutSession" SET "status" = 'succeeded'
            WHERE "stripePaymentIntentId" = ${paymentIntentId}`;
        });
      } catch (error) {
        if (isUniqueViolation(error)) return;
        throw error;
      }

      const created = await findOne(sql`o."stripePaymentIntentId" = ${paymentIntentId}`);
      if (created) {
        await realtime.orderCreated(
          {
            orderId: created.row.id,
            restaurantId: created.row.restaurantId,
            orderNumber: created.row.orderNumber,
            status: created.row.status,
          },
          created.row,
        );
      }
    },

    async markPaymentFailed(stripeEventId: string, paymentIntentId: string): Promise<void> {
      try {
        await sql.begin(async (tx) => {
          await tx`
            INSERT INTO "ProcessedStripeEvent" ("id", "type")
            VALUES (${stripeEventId}, 'payment_intent.payment_failed')`;
          await tx`
            UPDATE "CheckoutSession" SET "status" = 'failed'
            WHERE "stripePaymentIntentId" = ${paymentIntentId}`;
        });
      } catch (error) {
        if (isUniqueViolation(error)) return;
        throw error;
      }
    },

    async getById(orderId: string, deviceId: string): Promise<OrderResponse> {
      const found = await findOne(sql`o."id" = ${orderId}`);
      if (!found) {
        throw notFound(`Order ${orderId} not found`);
      }
      if (found.row.deviceId !== deviceId) {
        throw forbidden("This order does not belong to this device");
      }
      return found.response;
    },

    async getByPaymentIntentId(paymentIntentId: string): Promise<OrderResponse | null> {
      const found = await findOne(sql`o."stripePaymentIntentId" = ${paymentIntentId}`);
      return found?.response ?? null;
    },

    async listForDevice(deviceId: string): Promise<OrderResponse[]> {
      const found = await selectOrders(sql`c."deviceId" = ${deviceId}`, 50);
      return found.map((order) => order.response);
    },

    async listForRestaurant(restaurantId: string, status?: OrderStatus) {
      const found = await selectOrders(
        status
          ? sql`o."restaurantId" = ${restaurantId} AND o."status" = ${status}`
          : sql`o."restaurantId" = ${restaurantId}`,
      );
      return found.map((order) => order.response);
    },

    async getStats(restaurantId: string) {
      const today = startOfUtcDay(new Date());
      const yesterday = new Date(today.getTime() - DAY_MS);

      const [[counts], todayDay, yesterdayDay, firstOrders, [owed]] = await Promise.all([
        sql<{ active: number; ready: number; doneToday: number }[]>`
          SELECT
            count(*) FILTER (WHERE "status" IN ('WAITING', 'ACCEPTED'))::int AS "active",
            count(*) FILTER (WHERE "status" = 'READY')::int AS "ready",
            count(*) FILTER (WHERE "status" = 'PICKED_UP' AND "orderDate" = ${today})::int AS "doneToday"
          FROM "Order" WHERE "restaurantId" = ${restaurantId}`,
        dayTotals(restaurantId, today),
        dayTotals(restaurantId, yesterday),
        sql<{ firstAt: Date }[]>`
          SELECT min("createdAt") AS "firstAt" FROM "Order"
          WHERE "restaurantId" = ${restaurantId} GROUP BY "customerId"`,
        sql<{ owedCents: number | null; owedOrderCount: number }[]>`
          SELECT sum("restaurantReceivesCents")::int AS "owedCents", count(*)::int AS "owedOrderCount"
          FROM "Order" WHERE "restaurantId" = ${restaurantId} AND "paidOutAt" IS NULL`,
      ]);

      const newCustomersOn = (day: Date) =>
        firstOrders.filter(
          ({ firstAt }) => firstAt >= day && firstAt.getTime() < day.getTime() + DAY_MS,
        ).length;

      return {
        active: counts!.active,
        ready: counts!.ready,
        doneToday: counts!.doneToday,
        ordersToday: todayDay.orders,
        ordersYesterday: yesterdayDay.orders,
        salesTodayCents: todayDay.salesCents,
        salesYesterdayCents: yesterdayDay.salesCents,
        newCustomersToday: newCustomersOn(today),
        newCustomersYesterday: newCustomersOn(yesterday),
        avgPrepMinutesToday: todayDay.avgPrepMinutes,
        avgPrepMinutesYesterday: yesterdayDay.avgPrepMinutes,
        earnedTodayCents: todayDay.earnedCents,
        owedCents: owed!.owedCents ?? 0,
        owedOrderCount: owed!.owedOrderCount,
      };
    },

    async applyAction(orderId: string, action: OrderAction, demoKey: string | undefined) {
      const [order] = await sql<{ restaurantId: string; status: OrderStatus }[]>`
        SELECT "restaurantId", "status" FROM "Order" WHERE "id" = ${orderId}`;
      if (!order) {
        throw notFound(`Order ${orderId} not found`);
      }

      await assertRestaurantKey(sql, order.restaurantId, demoKey);

      const target = ACTION_TO_STATUS[action];
      if (!canTransition(order.status, target)) {
        throw conflict(`Cannot move order from ${order.status} to ${target}`);
      }

      const timestampColumn = STATUS_TIMESTAMP_COLUMN[target];
      await sql`
        UPDATE "Order" SET "status" = ${target}, "updatedAt" = now()
          ${timestampColumn ? sql`, ${sql(timestampColumn)} = now()` : sql``}
        WHERE "id" = ${orderId}`;

      const updated = (await findOne(sql`o."id" = ${orderId}`))!;
      await realtime.orderStatusChanged(
        { orderId: updated.row.id, restaurantId: updated.row.restaurantId, status: target },
        updated.row,
      );
      return updated.response;
    },

    async setAvailability(restaurantId: string, isOpen: boolean) {
      await sql`
        UPDATE "Restaurant" SET "isOpen" = ${isOpen}, "updatedAt" = now()
        WHERE "id" = ${restaurantId}`;
      await realtime.availabilityChanged({ restaurantId, isOpen });
      return { restaurantId, isOpen };
    },
  };
}

export type OrdersService = ReturnType<typeof createOrdersService>;

export function orderRoutes(orders: OrdersService) {
  return new Hono()
    .get("/", async (c) => {
      const deviceId = c.req.query("deviceId");
      if (!deviceId) throw badRequest("deviceId is required");
      return c.json(await orders.listForDevice(deviceId));
    })
    .get("/by-payment-intent/:paymentIntentId", async (c) => {
      const order = await orders.getByPaymentIntentId(c.req.param("paymentIntentId"));
      if (!order) throw notFound("Order not created yet");
      return c.json(order);
    })
    .get("/:id", async (c) => {
      const deviceId = c.req.query("deviceId");
      if (!deviceId) throw badRequest("deviceId is required");
      return c.json(await orders.getById(c.req.param("id"), deviceId));
    })
    .patch("/:id/actions", async (c) => {
      const body = await readJson(c, orderActionSchema);
      return c.json(
        await orders.applyAction(c.req.param("id"), body.action, c.req.header("x-restaurant-key")),
      );
    });
}

/** Everything under /restaurants/:restaurantId/* that requires the restaurant's demo key. */
export function restaurantOrderRoutes(sql: Sql, orders: OrdersService) {
  const authorize = async (c: Context) => {
    const restaurantId = c.req.param("restaurantId") as string;
    await assertRestaurantKey(sql, restaurantId, c.req.header("x-restaurant-key"));
    return restaurantId;
  };

  return new Hono()
    .get("/:restaurantId/orders", async (c) => {
      const restaurantId = await authorize(c);
      const query = parseWith(orderStatusQuerySchema, c.req.query());
      return c.json(await orders.listForRestaurant(restaurantId, query.status));
    })
    .get("/:restaurantId/stats", async (c) => {
      const restaurantId = await authorize(c);
      return c.json(await orders.getStats(restaurantId));
    })
    .patch("/:restaurantId/availability", async (c) => {
      const restaurantId = await authorize(c);
      const body = await readJson(c, setAvailabilitySchema);
      return c.json(await orders.setAvailability(restaurantId, body.isOpen));
    });
}

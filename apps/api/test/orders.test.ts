import { orderTopic, REALTIME_EVENTS, restaurantTopic } from "@foodiedeals/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createFixtureRestaurant,
  createTestApp,
  deleteFixtureRestaurant,
  oneDishMetadata,
  succeededEvent,
  type FixtureRestaurant,
} from "./harness";

describe("Webhook-created orders and restaurant actions", () => {
  const { sql, call, broadcasts } = createTestApp();
  const runId = Date.now();
  const eventIds: string[] = [];
  let restaurant: FixtureRestaurant;

  async function deliver(event: { id: string; type: string; data: unknown }) {
    eventIds.push(event.id);
    return call("POST", "/payments/webhook", {
      body: event,
      headers: { "stripe-signature": "test" },
    });
  }

  async function placeOrder(label: string, deviceId: string) {
    const paymentIntentId = `pi_e2e_${label}_${runId}`;
    const response = await deliver(
      succeededEvent(
        `evt_e2e_${label}_${runId}`,
        paymentIntentId,
        oneDishMetadata(restaurant, deviceId),
      ),
    );
    expect(response.status).toBe(200);
    const [order] = await sql<{ id: string; orderNumber: number }[]>`
      SELECT "id", "orderNumber" FROM "Order" WHERE "stripePaymentIntentId" = ${paymentIntentId}`;
    return order!;
  }

  beforeAll(async () => {
    restaurant = await createFixtureRestaurant(sql, "e2e-orders");
  });
  afterAll(async () => {
    await deleteFixtureRestaurant(sql, restaurant.id);
    await sql`DELETE FROM "ProcessedStripeEvent" WHERE "id" IN ${sql(eventIds)}`;
  });

  it("creates exactly one order even if the same event is delivered twice", async () => {
    const event = succeededEvent(
      `evt_e2e_dup_${runId}`,
      `pi_e2e_dup_${runId}`,
      oneDishMetadata(restaurant, "e2e-device-dup"),
    );
    expect((await deliver(event)).status).toBe(200);
    expect((await deliver(event)).status).toBe(200);

    const orders =
      await sql`SELECT 1 FROM "Order" WHERE "stripePaymentIntentId" = ${`pi_e2e_dup_${runId}`}`;
    expect(orders).toHaveLength(1);
  });

  it("assigns sequential order numbers per restaurant per day", async () => {
    const first = await placeOrder("seq1", "e2e-device-seq-a");
    const second = await placeOrder("seq2", "e2e-device-seq-b");
    expect(second.orderNumber).toBe(first.orderNumber + 1);
  });

  it("marks the checkout session failed without creating an order", async () => {
    const paymentIntentId = `pi_e2e_failed_${runId}`;
    await sql`
      INSERT INTO "CheckoutSession" ("restaurantId", "deviceId", "stripePaymentIntentId", "status")
      VALUES (${restaurant.id}, 'e2e-device-failed', ${paymentIntentId}, 'created')`;

    const response = await deliver({
      id: `evt_e2e_failed_${runId}`,
      type: "payment_intent.payment_failed",
      data: { object: { id: paymentIntentId, metadata: {} } },
    });
    expect(response.status).toBe(200);

    const [session] = await sql<{ status: string }[]>`
      SELECT "status" FROM "CheckoutSession" WHERE "stripePaymentIntentId" = ${paymentIntentId}`;
    const orders =
      await sql`SELECT 1 FROM "Order" WHERE "stripePaymentIntentId" = ${paymentIntentId}`;
    expect(session?.status).toBe("failed");
    expect(orders).toHaveLength(0);
  });

  it("rejects a webhook without a signature", async () => {
    const response = await call("POST", "/payments/webhook", { body: { id: "evt" } });
    expect(response.status).toBe(400);
  });

  it("announces a new order on the restaurant's and the customer's channels", async () => {
    const deviceId = `e2e-device-announce-${runId}`;
    const order = await placeOrder("announce", deviceId);

    expect(broadcasts).toContainEqual(
      expect.objectContaining({
        topic: restaurantTopic(restaurant.id, restaurant.demoKey),
        event: REALTIME_EVENTS.orderCreated,
        payload: expect.objectContaining({ orderId: order.id, orderNumber: order.orderNumber }),
      }),
    );
    expect(broadcasts).toContainEqual(
      expect.objectContaining({
        topic: orderTopic(order.id, deviceId),
        event: REALTIME_EVENTS.orderStatusChanged,
      }),
    );
  });

  it("only shows an order to the device that placed it", async () => {
    const deviceId = `e2e-device-owner-${runId}`;
    const order = await placeOrder("owner", deviceId);

    expect((await call("GET", `/orders/${order.id}?deviceId=${deviceId}`)).status).toBe(200);
    expect((await call("GET", `/orders/${order.id}?deviceId=someone-else`)).status).toBe(403);
    expect((await call("GET", `/orders/${order.id}`)).status).toBe(400);
    expect((await call("GET", "/orders/does-not-exist?deviceId=x")).status).toBe(404);

    const list = (await (await call("GET", `/orders?deviceId=${deviceId}`)).json()) as {
      id: string;
    }[];
    expect(list.map((entry) => entry.id)).toEqual([order.id]);
  });

  it("walks an order through accept, ready and picked up", async () => {
    const deviceId = `e2e-device-flow-${runId}`;
    const order = await placeOrder("flow", deviceId);
    const act = (action: string, key = restaurant.demoKey) =>
      call("PATCH", `/orders/${order.id}/actions`, {
        body: { action },
        headers: { "x-restaurant-key": key },
      });

    expect((await act("ACCEPT", "WRONG-KEY")).status).toBe(401);
    expect((await act("MARK_READY")).status).toBe(409);

    const accepted = await act("ACCEPT");
    expect(await accepted.json()).toMatchObject({
      status: "ACCEPTED",
      acceptedAt: expect.any(String),
    });
    expect(broadcasts).toContainEqual({
      topic: orderTopic(order.id, deviceId),
      event: REALTIME_EVENTS.orderStatusChanged,
      payload: { orderId: order.id, restaurantId: restaurant.id, status: "ACCEPTED" },
    });

    expect(await (await act("MARK_READY")).json()).toMatchObject({ status: "READY" });
    expect(await (await act("PICKED_UP")).json()).toMatchObject({ status: "PICKED_UP" });

    const stats = (await (
      await call("GET", `/restaurants/${restaurant.id}/stats`, {
        headers: { "x-restaurant-key": restaurant.demoKey },
      })
    ).json()) as { doneToday: number; ordersToday: number };
    expect(stats.doneToday).toBeGreaterThanOrEqual(1);
    expect(stats.ordersToday).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 when acting on an unknown order", async () => {
    const response = await call("PATCH", "/orders/does-not-exist/actions", {
      body: { action: "ACCEPT" },
      headers: { "x-restaurant-key": restaurant.demoKey },
    });
    expect(response.status).toBe(404);
  });
});

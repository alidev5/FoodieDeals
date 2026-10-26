import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createFixtureRestaurant, createTestApp, deleteFixtureRestaurant } from "./harness";

describe("Checkout and payment sync", () => {
  const { sql, call, stripe } = createTestApp();
  const runId = Date.now();
  const deviceId = `e2e-checkout-device-${runId}`;

  const cart = (items: { menuItemId: string; quantity: number }[]) => ({
    restaurantId: "miso-ember",
    deviceId,
    pickupName: "Checkout Tester",
    items,
  });
  const ramenAndGyoza = [
    { menuItemId: "miso-ramen", quantity: 1 },
    { menuItemId: "crispy-pork-gyoza", quantity: 1 },
  ];

  afterAll(async () => {
    await sql`DELETE FROM "OrderItem" WHERE "orderId" IN (
      SELECT o."id" FROM "Order" o JOIN "Customer" c ON c."id" = o."customerId" WHERE c."deviceId" = ${deviceId})`;
    await sql`DELETE FROM "Order" WHERE "customerId" IN (SELECT "id" FROM "Customer" WHERE "deviceId" = ${deviceId})`;
    await sql`DELETE FROM "CheckoutSession" WHERE "deviceId" = ${deviceId}`;
    await sql`DELETE FROM "ProcessedStripeEvent" WHERE "id" LIKE ${`sync:pi_fake_%`}`;
    await sql`DELETE FROM "Customer" WHERE "deviceId" = ${deviceId}`;
  });

  it("prices the worked example server-side", async () => {
    const response = await call("POST", "/checkout/quote", { body: cart(ramenAndGyoza) });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ totalCents: 2439, platformFeeCents: 122 });
  });

  it("rejects an item that isn't on the restaurant's menu", async () => {
    const response = await call("POST", "/checkout/quote", {
      body: cart([{ menuItemId: "not-on-menu", quantity: 1 }]),
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown restaurant", async () => {
    const response = await call("POST", "/checkout/quote", {
      body: { ...cart(ramenAndGyoza), restaurantId: "missing" },
    });
    expect(response.status).toBe(404);
  });

  it("creates a payment intent for the server-computed total", async () => {
    const response = await call("POST", "/checkout/payment-intent", { body: cart(ramenAndGyoza) });
    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      clientSecret: string;
      paymentIntentId: string;
      quote: { totalCents: number };
    };
    expect(body.clientSecret).toBe(`${body.paymentIntentId}_secret`);
    expect(body.quote.totalCents).toBe(2439);
    expect(stripe.intents.get(body.paymentIntentId)?.metadata).toMatchObject({
      restaurantId: "miso-ember",
      deviceId,
      totalCents: "2439",
    });

    const [session] = await sql<{ status: string }[]>`
      SELECT "status" FROM "CheckoutSession" WHERE "stripePaymentIntentId" = ${body.paymentIntentId}`;
    expect(session?.status).toBe("created");
  });

  it("creates the order on sync once Stripe reports success, exactly once", async () => {
    const created = (await (
      await call("POST", "/checkout/payment-intent", { body: cart(ramenAndGyoza) })
    ).json()) as { paymentIntentId: string };

    const early = await call("POST", `/payments/intents/${created.paymentIntentId}/sync`);
    expect(early.status).toBe(404);
    expect(await early.json()).toMatchObject({ message: "Payment is requires payment method" });

    stripe.intents.get(created.paymentIntentId)!.status = "succeeded";
    const synced = await call("POST", `/payments/intents/${created.paymentIntentId}/sync`);
    expect(synced.status).toBe(200);
    const order = (await synced.json()) as { id: string; status: string; totalCents: number };
    expect(order).toMatchObject({ status: "WAITING", totalCents: 2439 });

    const again = (await (
      await call("POST", `/payments/intents/${created.paymentIntentId}/sync`)
    ).json()) as { id: string };
    expect(again.id).toBe(order.id);

    const byIntent = await call("GET", `/orders/by-payment-intent/${created.paymentIntentId}`);
    expect(((await byIntent.json()) as { id: string }).id).toBe(order.id);
  });

  it("returns 404 when Stripe doesn't know the payment", async () => {
    const response = await call("POST", "/payments/intents/pi_unknown/sync");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "Payment not found" });
  });

  describe("when the restaurant is paused", () => {
    const pausedId = "e2e-paused";

    beforeAll(async () => {
      await createFixtureRestaurant(sql, pausedId);
      await sql`UPDATE "Restaurant" SET "isOpen" = FALSE WHERE "id" = ${pausedId}`;
    });
    afterAll(() => deleteFixtureRestaurant(sql, pausedId));

    it("refuses to take payment", async () => {
      const response = await call("POST", "/checkout/payment-intent", {
        body: {
          ...cart([{ menuItemId: `${pausedId}-item`, quantity: 1 }]),
          restaurantId: pausedId,
        },
      });
      expect(response.status).toBe(409);
    });
  });
});

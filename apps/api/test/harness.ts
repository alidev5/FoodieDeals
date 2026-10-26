import { afterAll } from "vitest";

import { createApp } from "../src/app";
import { createSql } from "../src/db";
import { encodePaymentIntentMetadata } from "../src/paymentIntentMetadata";
import type { RealtimeMessage, RealtimeSender } from "../src/realtime";
import type { StripeClient } from "../src/stripe";

export interface TestStripe extends StripeClient {
  intents: Map<string, { status: string; metadata: Record<string, string> }>;
}

/** Webhook "signatures" are skipped: the fake treats the raw body as the verified event. */
export function createFakeStripe(): TestStripe {
  const intents = new Map<string, { status: string; metadata: Record<string, string> }>();
  let counter = 0;
  return {
    intents,
    async createPaymentIntent({ metadata }) {
      const id = `pi_fake_${Date.now()}_${counter++}`;
      intents.set(id, { status: "requires_payment_method", metadata });
      return { id, clientSecret: `${id}_secret` };
    },
    async retrievePaymentIntent(id) {
      const intent = intents.get(id);
      if (!intent) throw new Error(`No such payment_intent: ${id}`);
      return { id, ...intent };
    },
    async constructWebhookEvent(rawBody) {
      return JSON.parse(rawBody);
    },
  };
}

export function createTestApp() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set for the e2e tests");

  const sql = createSql(databaseUrl);
  const stripe = createFakeStripe();
  const broadcasts: RealtimeMessage[] = [];
  const realtime: RealtimeSender = {
    send: async (messages) => {
      broadcasts.push(...messages);
    },
  };
  const app = createApp({ sql, stripe, realtime });

  afterAll(() => sql.end());

  const call = (
    method: string,
    path: string,
    init: { body?: unknown; headers?: Record<string, string> } = {},
  ) =>
    app.request(`/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

  return { app, sql, stripe, broadcasts, call };
}

export interface FixtureRestaurant {
  id: string;
  demoKey: string;
  menuItem: { id: string; name: string; priceCents: number };
}

export async function createFixtureRestaurant(
  sql: ReturnType<typeof createSql>,
  id: string,
  options: { deal?: boolean } = {},
): Promise<FixtureRestaurant> {
  const fixture = {
    id,
    demoKey: `${id.toUpperCase()}-KEY`,
    menuItem: { id: `${id}-item`, name: "Test Dish", priceCents: 1000 },
  };
  await deleteFixtureRestaurant(sql, id);
  await sql`
    INSERT INTO "Restaurant" ("id", "name", "demoKey", "cuisine", "isOpen")
    VALUES (${id}, ${`${id} Kitchen`}, ${fixture.demoKey}, 'Test', TRUE)`;
  await sql`
    INSERT INTO "MenuItem" ("id", "restaurantId", "name", "priceCents")
    VALUES (${fixture.menuItem.id}, ${id}, ${fixture.menuItem.name}, ${fixture.menuItem.priceCents})`;
  if (options.deal) {
    await sql`
      INSERT INTO "Deal" ("id", "restaurantId", "name", "type", "percent")
      VALUES (${`${id}-deal`}, ${id}, '10% off', 'PERCENT_OFF', 10)`;
  }
  return fixture;
}

export async function deleteFixtureRestaurant(sql: ReturnType<typeof createSql>, id: string) {
  await sql`DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "restaurantId" = ${id})`;
  await sql`DELETE FROM "Order" WHERE "restaurantId" = ${id}`;
  await sql`DELETE FROM "CheckoutSession" WHERE "restaurantId" = ${id}`;
  await sql`DELETE FROM "DailyOrderCounter" WHERE "restaurantId" = ${id}`;
  await sql`DELETE FROM "Deal" WHERE "restaurantId" = ${id}`;
  await sql`DELETE FROM "MenuItem" WHERE "restaurantId" = ${id}`;
  await sql`DELETE FROM "Restaurant" WHERE "id" = ${id}`;
}

/** Metadata for a one-dish order, as checkout would have attached it to the payment intent. */
export function oneDishMetadata(fixture: FixtureRestaurant, deviceId: string) {
  const { priceCents } = fixture.menuItem;
  const taxCents = Math.floor(priceCents * 0.08875 + 0.5);
  const totalCents = priceCents + taxCents;
  const platformFeeCents = Math.floor(totalCents * 0.05 + 0.5);
  return encodePaymentIntentMetadata({
    restaurantId: fixture.id,
    deviceId,
    pickupName: "E2E Tester",
    items: [
      { menuItemId: fixture.menuItem.id, name: fixture.menuItem.name, priceCents, quantity: 1 },
    ],
    subtotalCents: priceCents,
    discountCents: 0,
    taxCents,
    totalCents,
    platformFeeCents,
    restaurantReceivesCents: totalCents - platformFeeCents,
    appliedDealId: "",
    appliedDealName: "",
  });
}

export function succeededEvent(
  eventId: string,
  paymentIntentId: string,
  metadata: Record<string, string>,
) {
  return {
    id: eventId,
    type: "payment_intent.succeeded",
    data: { object: { id: paymentIntentId, metadata } },
  };
}

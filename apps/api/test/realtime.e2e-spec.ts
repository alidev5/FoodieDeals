import { addLine, computeQuote, createEmptyCart, SOCKET_EVENTS, type Deal, type MenuItem } from "@foodiedeals/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { encodePaymentIntentMetadata } from "../src/checkout/payment-intent-metadata";
import { STRIPE_CLIENT, type StripeClient } from "../src/payments/stripe-client";
import { PrismaService } from "../src/prisma/prisma.service";

const fakeStripeClient: StripeClient = {
  createPaymentIntent: async () => {
    throw new Error("not used in this test");
  },
  constructWebhookEvent: (rawBody) => JSON.parse(rawBody.toString()),
};

function waitForAck<T>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (ack: T) => resolve(ack));
  });
}

function waitForEvent<T>(socket: Socket, event: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

describe("Realtime (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  const runId = Date.now();
  const restaurantId = "e2e-realtime-restaurant";
  const demoKey = "E2E-REALTIME-0000";
  const menuItem: MenuItem = { id: "e2e-realtime-item", restaurantId, name: "Test Dish", priceCents: 1000 };
  const deals: Deal[] = [];
  const eventId = `evt_e2e_realtime_${runId}`;
  const paymentIntentId = `pi_e2e_realtime_${runId}`;
  const deviceId = `e2e-realtime-device-${runId}`;

  const sockets: Socket[] = [];

  function connectClient(): Socket {
    const socket = io(baseUrl, { transports: ["websocket"], forceNew: true });
    sockets.push(socket);
    return socket;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STRIPE_CLIENT)
      .useValue(fakeStripeClient)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    prisma = app.get(PrismaService);

    await prisma.restaurant.upsert({
      where: { id: restaurantId },
      create: {
        id: restaurantId,
        name: "E2E Realtime Kitchen",
        demoKey,
        cuisine: "Test",
        isOpen: true,
        menuItems: { create: [{ id: menuItem.id, name: menuItem.name, priceCents: menuItem.priceCents }] },
      },
      update: {},
    });

    let cart = createEmptyCart();
    cart = addLine(cart, menuItem);
    const quote = computeQuote(cart, deals, new Date(), false);

    const metadata = encodePaymentIntentMetadata({
      restaurantId,
      deviceId,
      pickupName: "E2E Realtime Tester",
      items: [{ menuItemId: menuItem.id, name: menuItem.name, priceCents: menuItem.priceCents, quantity: 1 }],
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      platformFeeCents: quote.platformFeeCents,
      restaurantReceivesCents: quote.restaurantReceivesCents,
      appliedDealId: quote.appliedDeal?.dealId ?? "",
      appliedDealName: quote.appliedDeal?.dealName ?? "",
    });

    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("stripe-signature", "test")
      .send({ id: eventId, type: "payment_intent.succeeded", data: { object: { id: paymentIntentId, metadata } } })
      .expect(200);
  });

  afterAll(async () => {
    for (const socket of sockets) {
      socket.disconnect();
    }
    await prisma.orderItem.deleteMany({ where: { order: { restaurantId } } });
    await prisma.order.deleteMany({ where: { restaurantId } });
    await prisma.dailyOrderCounter.deleteMany({ where: { restaurantId } });
    await prisma.menuItem.deleteMany({ where: { restaurantId } });
    await prisma.processedStripeEvent.deleteMany({ where: { id: eventId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await app.close();
  });

  it("rejects a customer joining an order room with the wrong device id", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { stripePaymentIntentId: paymentIntentId } });
    const intruder = connectClient();

    const ack = await waitForAck<{ ok: boolean }>(intruder, SOCKET_EVENTS.joinOrderRoom, {
      orderId: order.id,
      deviceId: "someone-elses-device",
    });

    expect(ack.ok).toBe(false);
  });

  it("delivers a restaurant action to the customer's order room within 2 seconds", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { stripePaymentIntentId: paymentIntentId } });

    const customer = connectClient();
    const customerAck = await waitForAck<{ ok: boolean }>(customer, SOCKET_EVENTS.joinOrderRoom, {
      orderId: order.id,
      deviceId,
    });
    expect(customerAck.ok).toBe(true);

    const statusChanged = waitForEvent<{ orderId: string; status: string }>(
      customer,
      SOCKET_EVENTS.orderStatusChanged,
      2000,
    );

    const startedAt = Date.now();
    await request(app.getHttpServer())
      .patch(`/orders/${order.id}/actions`)
      .set("x-restaurant-key", demoKey)
      .send({ action: "ACCEPT" })
      .expect(200);

    const payload = await statusChanged;
    const elapsedMs = Date.now() - startedAt;

    expect(payload.status).toBe("ACCEPTED");
    expect(elapsedMs).toBeLessThan(2000);
  });
});

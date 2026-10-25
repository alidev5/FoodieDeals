import { addLine, computeQuote, createEmptyCart, type Deal, type MenuItem } from "@foodiedeals/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
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

describe("Stripe webhook (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const restaurantId = "e2e-webhook-restaurant";
  const eventIds = [
    `evt_e2e_dup_${runId}`,
    `evt_e2e_seq_1_${runId}`,
    `evt_e2e_seq_2_${runId}`,
    `evt_e2e_failed_${runId}`,
  ];
  const menuItem: MenuItem = {
    id: "e2e-webhook-item",
    restaurantId,
    name: "Test Dish",
    priceCents: 1000,
  };
  const deals: Deal[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STRIPE_CLIENT)
      .useValue(fakeStripeClient)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.restaurant.upsert({
      where: { id: restaurantId },
      create: {
        id: restaurantId,
        name: "E2E Webhook Kitchen",
        demoKey: "E2E-WEBHOOK-0000",
        cuisine: "Test",
        isOpen: true,
        menuItems: { create: [{ id: menuItem.id, name: menuItem.name, priceCents: menuItem.priceCents }] },
      },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { order: { restaurantId } } });
    await prisma.order.deleteMany({ where: { restaurantId } });
    await prisma.dailyOrderCounter.deleteMany({ where: { restaurantId } });
    await prisma.menuItem.deleteMany({ where: { restaurantId } });
    await prisma.processedStripeEvent.deleteMany({ where: { id: { in: eventIds } } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await app.close();
  });

  function buildSucceededEvent(eventId: string, paymentIntentId: string, deviceId: string) {
    let cart = createEmptyCart();
    cart = addLine(cart, menuItem);
    const quote = computeQuote(cart, deals, new Date(), false);

    const metadata = encodePaymentIntentMetadata({
      restaurantId,
      deviceId,
      pickupName: "E2E Webhook Tester",
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

    return {
      id: eventId,
      type: "payment_intent.succeeded",
      data: { object: { id: paymentIntentId, metadata } },
    };
  }

  it("creates exactly one order even if the same event is delivered twice", async () => {
    const event = buildSucceededEvent(eventIds[0]!, `pi_e2e_dup_${runId}`, "e2e-device-dup");

    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("stripe-signature", "test")
      .send(event)
      .expect(200);

    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("stripe-signature", "test")
      .send(event)
      .expect(200);

    const orders = await prisma.order.findMany({ where: { stripePaymentIntentId: `pi_e2e_dup_${runId}` } });
    expect(orders).toHaveLength(1);
  });

  it("assigns sequential order numbers per restaurant per day", async () => {
    const first = buildSucceededEvent(eventIds[1]!, `pi_e2e_seq_1_${runId}`, "e2e-device-seq-a");
    const second = buildSucceededEvent(eventIds[2]!, `pi_e2e_seq_2_${runId}`, "e2e-device-seq-b");

    await request(app.getHttpServer()).post("/payments/webhook").set("stripe-signature", "test").send(first).expect(200);
    await request(app.getHttpServer()).post("/payments/webhook").set("stripe-signature", "test").send(second).expect(200);

    const firstOrder = await prisma.order.findUnique({ where: { stripePaymentIntentId: `pi_e2e_seq_1_${runId}` } });
    const secondOrder = await prisma.order.findUnique({ where: { stripePaymentIntentId: `pi_e2e_seq_2_${runId}` } });

    expect(secondOrder?.orderNumber).toBe((firstOrder?.orderNumber ?? 0) + 1);
  });

  it("marks the checkout session failed on payment_intent.payment_failed, without creating an order", async () => {
    const paymentIntentId = `pi_e2e_failed_${runId}`;
    const failedEvent = {
      id: eventIds[3]!,
      type: "payment_intent.payment_failed",
      data: { object: { id: paymentIntentId, metadata: {} } },
    };

    await prisma.checkoutSession.create({
      data: {
        restaurantId,
        deviceId: "e2e-device-failed",
        stripePaymentIntentId: paymentIntentId,
        status: "created",
      },
    });

    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("stripe-signature", "test")
      .send(failedEvent)
      .expect(200);

    const session = await prisma.checkoutSession.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });

    expect(session?.status).toBe("failed");
    expect(order).toBeNull();

    await prisma.checkoutSession.delete({ where: { stripePaymentIntentId: paymentIntentId } });
  });
});

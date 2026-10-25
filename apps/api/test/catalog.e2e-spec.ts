import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Catalog (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const restaurantId = "e2e-test-restaurant";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.restaurant.upsert({
      where: { id: restaurantId },
      create: {
        id: restaurantId,
        name: "E2E Test Kitchen",
        demoKey: "E2E-0000",
        cuisine: "Test",
        isOpen: true,
        menuItems: {
          create: [{ id: "e2e-item", name: "Test Dish", priceCents: 1000 }],
        },
        deals: {
          create: [
            {
              id: "e2e-deal",
              name: "10% off",
              type: "PERCENT_OFF",
              percent: 10,
            },
          ],
        },
      },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.deal.deleteMany({ where: { restaurantId } });
    await prisma.menuItem.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await app.close();
  });

  it("lists restaurants including the fixture", async () => {
    const response = await request(app.getHttpServer()).get("/restaurants").expect(200);

    const found = response.body.find((restaurant: { id: string }) => restaurant.id === restaurantId);
    expect(found).toBeDefined();
    expect(found.menu).toHaveLength(1);
    expect(found.deals[0]).toMatchObject({ type: "PERCENT_OFF", percent: 10 });
  });

  it("filters by dealType", async () => {
    const response = await request(app.getHttpServer())
      .get("/restaurants")
      .query({ dealType: "PERCENT_OFF" })
      .expect(200);

    expect(response.body.some((restaurant: { id: string }) => restaurant.id === restaurantId)).toBe(true);
  });

  it("rejects an invalid dealType", async () => {
    await request(app.getHttpServer()).get("/restaurants").query({ dealType: "NOT_A_TYPE" }).expect(400);
  });

  it("gets a restaurant by id", async () => {
    const response = await request(app.getHttpServer()).get(`/restaurants/${restaurantId}`).expect(200);
    expect(response.body.name).toBe("E2E Test Kitchen");
  });

  it("returns 404 for an unknown restaurant", async () => {
    await request(app.getHttpServer()).get("/restaurants/does-not-exist").expect(404);
  });

  it("creates a customer", async () => {
    const response = await request(app.getHttpServer())
      .post("/customers")
      .send({ deviceId: "e2e-device", pickupName: "E2E Tester" })
      .expect(201);

    expect(response.body).toMatchObject({ deviceId: "e2e-device", pickupName: "E2E Tester" });

    await prisma.customer.delete({ where: { deviceId: "e2e-device" } });
  });

  it("reports health", async () => {
    await request(app.getHttpServer()).get("/health").expect(200, { status: "ok" });
  });
});

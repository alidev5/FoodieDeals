import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Restaurant orders endpoints (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const restaurantId = "e2e-restaurant-orders";
  const demoKey = "E2E-ORDERS-0000";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.restaurant.upsert({
      where: { id: restaurantId },
      create: { id: restaurantId, name: "E2E Orders Kitchen", demoKey, cuisine: "Test", isOpen: true },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await app.close();
  });

  it("rejects requests without the restaurant key", async () => {
    await request(app.getHttpServer()).get(`/restaurants/${restaurantId}/orders`).expect(401);
  });

  it("rejects requests with the wrong restaurant key", async () => {
    await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/orders`)
      .set("x-restaurant-key", "WRONG-KEY")
      .expect(401);
  });

  it("lists orders for the restaurant with the correct key", async () => {
    const response = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/orders`)
      .set("x-restaurant-key", demoKey)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("returns live stats", async () => {
    const response = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/stats`)
      .set("x-restaurant-key", demoKey)
      .expect(200);

    expect(response.body).toEqual({ active: 0, ready: 0, completedToday: 0, revenueTodayCents: 0 });
  });

  it("toggles availability", async () => {
    await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}/availability`)
      .set("x-restaurant-key", demoKey)
      .send({ isOpen: false })
      .expect(200, { restaurantId, isOpen: false });

    const restaurant = await prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
    expect(restaurant.isOpen).toBe(false);
  });
});

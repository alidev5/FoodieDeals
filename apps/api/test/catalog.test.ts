import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createFixtureRestaurant, createTestApp, deleteFixtureRestaurant } from "./harness";

describe("Catalog", () => {
  const { sql, call } = createTestApp();
  const restaurantId = "e2e-catalog";

  beforeAll(() => createFixtureRestaurant(sql, restaurantId, { deal: true }));
  afterAll(() => deleteFixtureRestaurant(sql, restaurantId));

  it("lists restaurants including the fixture", async () => {
    const response = await call("GET", "/restaurants");
    expect(response.status).toBe(200);

    const body = (await response.json()) as { id: string; menu: unknown[]; deals: unknown[] }[];
    const found = body.find((restaurant) => restaurant.id === restaurantId);
    expect(found?.menu).toHaveLength(1);
    expect(found?.deals[0]).toMatchObject({ type: "PERCENT_OFF", percent: 10 });
  });

  it("filters by dealType", async () => {
    const percentOff = (await (await call("GET", "/restaurants?dealType=PERCENT_OFF")).json()) as {
      id: string;
    }[];
    const bogo = (await (await call("GET", "/restaurants?dealType=BOGO")).json()) as {
      id: string;
    }[];

    expect(percentOff.some((restaurant) => restaurant.id === restaurantId)).toBe(true);
    expect(bogo.some((restaurant) => restaurant.id === restaurantId)).toBe(false);
  });

  it("rejects an invalid dealType", async () => {
    const response = await call("GET", "/restaurants?dealType=NOT_A_TYPE");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid dealType: NOT_A_TYPE",
    });
  });

  it("gets a restaurant by id", async () => {
    const response = await call("GET", `/restaurants/${restaurantId}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ name: `${restaurantId} Kitchen` });
  });

  it("returns 404 for an unknown restaurant", async () => {
    expect((await call("GET", "/restaurants/does-not-exist")).status).toBe(404);
  });

  it("creates and updates a customer by device id", async () => {
    const created = await call("POST", "/customers", {
      body: { deviceId: "e2e-device", pickupName: "E2E Tester" },
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      deviceId: "e2e-device",
      pickupName: "E2E Tester",
    });

    const renamed = await call("POST", "/customers", {
      body: { deviceId: "e2e-device", pickupName: "Renamed" },
    });
    expect(await renamed.json()).toMatchObject({ deviceId: "e2e-device", pickupName: "Renamed" });

    await sql`DELETE FROM "Customer" WHERE "deviceId" = 'e2e-device'`;
  });

  it("rejects an invalid customer body", async () => {
    expect((await call("POST", "/customers", { body: { deviceId: "" } })).status).toBe(400);
  });

  it("reports health", async () => {
    const response = await call("GET", "/health");
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

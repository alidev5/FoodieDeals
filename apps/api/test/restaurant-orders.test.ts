import { REALTIME_EVENTS, RESTAURANTS_TOPIC } from "@foodiedeals/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createFixtureRestaurant,
  createTestApp,
  deleteFixtureRestaurant,
  type FixtureRestaurant,
} from "./harness";

describe("Restaurant dashboard endpoints", () => {
  const { sql, call, broadcasts } = createTestApp();
  let restaurant: FixtureRestaurant;

  beforeAll(async () => {
    restaurant = await createFixtureRestaurant(sql, "e2e-dashboard");
  });
  afterAll(() => deleteFixtureRestaurant(sql, restaurant.id));

  const withKey = (key: string) => ({ headers: { "x-restaurant-key": key } });

  it("rejects requests without the restaurant key", async () => {
    expect((await call("GET", `/restaurants/${restaurant.id}/orders`)).status).toBe(401);
  });

  it("rejects requests with the wrong restaurant key", async () => {
    const response = await call(
      "GET",
      `/restaurants/${restaurant.id}/orders`,
      withKey("WRONG-KEY"),
    );
    expect(response.status).toBe(401);
  });

  it("lists orders for the restaurant with the correct key", async () => {
    const response = await call(
      "GET",
      `/restaurants/${restaurant.id}/orders`,
      withKey(restaurant.demoKey),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("rejects an invalid status filter", async () => {
    const response = await call(
      "GET",
      `/restaurants/${restaurant.id}/orders?status=LOST`,
      withKey(restaurant.demoKey),
    );
    expect(response.status).toBe(400);
  });

  it("returns live stats", async () => {
    const response = await call(
      "GET",
      `/restaurants/${restaurant.id}/stats`,
      withKey(restaurant.demoKey),
    );

    expect(await response.json()).toEqual({
      active: 0,
      ready: 0,
      doneToday: 0,
      ordersToday: 0,
      ordersYesterday: 0,
      salesTodayCents: 0,
      salesYesterdayCents: 0,
      newCustomersToday: 0,
      newCustomersYesterday: 0,
      avgPrepMinutesToday: null,
      avgPrepMinutesYesterday: null,
      earnedTodayCents: 0,
      owedCents: 0,
      owedOrderCount: 0,
    });
  });

  it("toggles availability and tells every customer", async () => {
    const response = await call("PATCH", `/restaurants/${restaurant.id}/availability`, {
      ...withKey(restaurant.demoKey),
      body: { isOpen: false },
    });
    expect(await response.json()).toEqual({ restaurantId: restaurant.id, isOpen: false });

    const [row] = await sql<{ isOpen: boolean }[]>`
      SELECT "isOpen" FROM "Restaurant" WHERE "id" = ${restaurant.id}`;
    expect(row?.isOpen).toBe(false);
    expect(broadcasts).toContainEqual({
      topic: RESTAURANTS_TOPIC,
      event: REALTIME_EVENTS.restaurantAvailabilityChanged,
      payload: { restaurantId: restaurant.id, isOpen: false },
    });
  });

  it("keeps the public restaurant endpoint open without a key", async () => {
    expect((await call("GET", `/restaurants/${restaurant.id}`)).status).toBe(200);
  });
});

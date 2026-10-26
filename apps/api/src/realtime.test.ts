import { orderTopic, REALTIME_EVENTS, restaurantTopic } from "@foodiedeals/shared";
import { describe, expect, it, vi } from "vitest";

import { createRealtimePublisher, type RealtimeMessage } from "./realtime";

describe("realtime publisher", () => {
  const payload = {
    orderId: "order-1",
    restaurantId: "rest-1",
    orderNumber: 7,
    status: "WAITING" as const,
  };
  const audience = { demoKey: "KEY-1", deviceId: "device-1" };

  it("sends a new order to the restaurant and the ordering device only", async () => {
    const sent: RealtimeMessage[] = [];
    await createRealtimePublisher({
      send: async (messages) => void sent.push(...messages),
    }).orderCreated(payload, audience);

    expect(sent).toEqual([
      { topic: restaurantTopic("rest-1", "KEY-1"), event: REALTIME_EVENTS.orderCreated, payload },
      {
        topic: orderTopic("order-1", "device-1"),
        event: REALTIME_EVENTS.orderStatusChanged,
        payload,
      },
    ]);
  });

  it("derives channel names that can't be guessed without the secret", () => {
    expect(restaurantTopic("rest-1", "KEY-1")).not.toBe(restaurantTopic("rest-1", "KEY-2"));
    expect(restaurantTopic("rest-1", "KEY-1")).not.toContain("KEY-1");
    expect(orderTopic("order-1", "device-1")).toMatch(/^order-[0-9a-f]{64}$/);
  });

  it("never fails the request when the broadcast fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const publisher = createRealtimePublisher({ send: () => Promise.reject(new Error("down")) });

    await expect(
      publisher.availabilityChanged({ restaurantId: "rest-1", isOpen: true }),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

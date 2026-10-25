import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test } from "@nestjs/testing";

import { PrismaService } from "../prisma/prisma.service";

import { OrdersService } from "./orders.service";

function baseOrder(status: string) {
  return {
    id: "order-1",
    restaurantId: "miso-ember",
    status,
    createdAt: new Date("2026-01-01T12:00:00Z"),
    items: [],
    restaurant: { name: "Miso & Ember Kitchen", address: null, phone: null },
    customer: { pickupName: "Hamza M.", deviceId: "device-1" },
  };
}

describe("OrdersService.applyAction", () => {
  let service: OrdersService;
  const orderFindUnique = jest.fn();
  const orderUpdate = jest.fn();
  const restaurantFindUnique = jest.fn();
  const emit = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    restaurantFindUnique.mockResolvedValue({ demoKey: "MISO-0001" });

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: { findUnique: orderFindUnique, update: orderUpdate },
            restaurant: { findUnique: restaurantFindUnique },
          },
        },
        { provide: EventEmitter2, useValue: { emit } },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("throws if the order does not exist", async () => {
    orderFindUnique.mockResolvedValue(null);

    await expect(service.applyAction("missing", "ACCEPT", "MISO-0001")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects a mismatched restaurant key", async () => {
    orderFindUnique.mockResolvedValue(baseOrder("WAITING"));

    await expect(service.applyAction("order-1", "ACCEPT", "WRONG-KEY")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each([
    ["WAITING", "ACCEPT", "ACCEPTED"],
    ["ACCEPTED", "MARK_READY", "READY"],
    ["READY", "PICKED_UP", "PICKED_UP"],
  ] as const)("allows %s --%s--> %s", async (from, action, to) => {
    orderFindUnique.mockResolvedValue(baseOrder(from));
    orderUpdate.mockResolvedValue({ ...baseOrder(to), status: to });

    const result = await service.applyAction("order-1", action, "MISO-0001");

    expect(result.status).toBe(to);
    expect(emit).toHaveBeenCalledWith(
      "order.status-changed",
      expect.objectContaining({ orderId: "order-1", status: to }),
    );
  });

  it.each([
    ["WAITING", "MARK_READY"],
    ["WAITING", "PICKED_UP"],
    ["ACCEPTED", "PICKED_UP"],
    ["PICKED_UP", "ACCEPT"],
  ] as const)("rejects %s --%s-->", async (from, action) => {
    orderFindUnique.mockResolvedValue(baseOrder(from));

    await expect(service.applyAction("order-1", action, "MISO-0001")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(orderUpdate).not.toHaveBeenCalled();
  });
});

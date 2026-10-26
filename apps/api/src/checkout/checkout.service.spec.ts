import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { STRIPE_CLIENT } from "../payments/stripe-client";
import { PrismaService } from "../prisma/prisma.service";
import { RestaurantsService } from "../restaurants/restaurants.service";

import { CheckoutService } from "./checkout.service";

const misoEmber = {
  id: "miso-ember",
  name: "Miso & Ember Kitchen",
  demoKey: "MISO-0001",
  isOpen: true,
  cuisine: "Japanese",
  menu: [
    { id: "miso-ramen", restaurantId: "miso-ember", name: "Miso Ramen", priceCents: 1600 },
    {
      id: "crispy-pork-gyoza",
      restaurantId: "miso-ember",
      name: "Crispy Pork Gyoza (6)",
      priceCents: 1200,
    },
  ],
  deals: [
    {
      id: "miso-ember-percent-off-25",
      restaurantId: "miso-ember",
      name: "20% off orders over $25",
      type: "PERCENT_OFF" as const,
      percent: 20,
      conditions: { minSubtotalCents: 2500 },
    },
  ],
};

describe("CheckoutService", () => {
  let service: CheckoutService;
  const getById = jest.fn();
  const findUnique = jest.fn();
  const findUniqueOrThrow = jest.fn();
  const findFirst = jest.fn();
  const upsert = jest.fn();
  const checkoutSessionCreate = jest.fn();
  const createPaymentIntent = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue(null);
    findFirst.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: RestaurantsService, useValue: { getById } },
        {
          provide: PrismaService,
          useValue: {
            customer: { findUnique, upsert },
            order: { findFirst },
            restaurant: { findUniqueOrThrow },
            checkoutSession: { create: checkoutSessionCreate },
          },
        },
        { provide: STRIPE_CLIENT, useValue: { createPaymentIntent } },
      ],
    }).compile();

    service = moduleRef.get(CheckoutService);
  });

  describe("quote", () => {
    it("computes the worked-example totals", async () => {
      getById.mockResolvedValue(misoEmber);

      const quote = await service.quote({
        restaurantId: "miso-ember",
        deviceId: "device-1",
        items: [
          { menuItemId: "miso-ramen", quantity: 1 },
          { menuItemId: "crispy-pork-gyoza", quantity: 1 },
        ],
      });

      expect(quote.totalCents).toBe(2439);
      expect(quote.platformFeeCents).toBe(122);
    });

    it("throws when the restaurant does not exist", async () => {
      getById.mockResolvedValue(null);

      await expect(
        service.quote({
          restaurantId: "missing",
          deviceId: "device-1",
          items: [{ menuItemId: "x", quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects an item that does not belong to the restaurant", async () => {
      getById.mockResolvedValue(misoEmber);

      await expect(
        service.quote({
          restaurantId: "miso-ember",
          deviceId: "device-1",
          items: [{ menuItemId: "not-on-menu", quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("createPaymentIntent", () => {
    it("rejects when the restaurant is paused", async () => {
      getById.mockResolvedValue({ ...misoEmber, isOpen: false });

      await expect(
        service.createPaymentIntent({
          restaurantId: "miso-ember",
          deviceId: "device-1",
          pickupName: "Hamza M.",
          items: [{ menuItemId: "miso-ramen", quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates a platform-account payment intent for the server-computed total", async () => {
      getById.mockResolvedValue(misoEmber);
      createPaymentIntent.mockResolvedValue({ id: "pi_123", clientSecret: "secret_123" });

      const result = await service.createPaymentIntent({
        restaurantId: "miso-ember",
        deviceId: "device-1",
        pickupName: "Hamza M.",
        items: [
          { menuItemId: "miso-ramen", quantity: 1 },
          { menuItemId: "crispy-pork-gyoza", quantity: 1 },
        ],
      });

      expect(result.clientSecret).toBe("secret_123");
      expect(result.quote.totalCents).toBe(2439);
      expect(createPaymentIntent).toHaveBeenCalledWith(
        expect.not.objectContaining({ destinationAccountId: expect.anything() }),
      );
      expect(createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 2439 }),
      );
      expect(checkoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stripePaymentIntentId: "pi_123", status: "created" }),
        }),
      );
    });
  });
});

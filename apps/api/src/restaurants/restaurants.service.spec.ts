import { Test } from "@nestjs/testing";

import { PrismaService } from "../prisma/prisma.service";

import { RestaurantsService } from "./restaurants.service";

const misoEmberRow = {
  id: "miso-ember",
  name: "Miso & Ember Kitchen",
  demoKey: "MISO-0001",
  cuisine: "Japanese",
  isOpen: true,
  heroPhoto: "miso-ember-hero.png",
  address: null,
  phone: null,
  stripeAccountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  menuItems: [
    {
      id: "miso-ramen",
      restaurantId: "miso-ember",
      name: "Miso Ramen",
      priceCents: 1600,
      photo: "miso-ramen.png",
    },
  ],
  deals: [
    {
      id: "miso-ember-percent-off-25",
      restaurantId: "miso-ember",
      name: "20% off orders over $25",
      type: "PERCENT_OFF" as const,
      percent: 20,
      freeItemId: null,
      bundleSize: null,
      bundlePriceCents: null,
      eligibleItemIds: null,
      minSubtotalCents: 2500,
      timeWindowStart: null,
      timeWindowEnd: null,
      firstVisitOnly: null,
    },
  ],
};

describe("RestaurantsService", () => {
  let service: RestaurantsService;
  const findMany = jest.fn();
  const findUnique = jest.fn();

  beforeEach(async () => {
    findMany.mockReset();
    findUnique.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PrismaService,
          useValue: { restaurant: { findMany, findUnique } },
        },
      ],
    }).compile();

    service = moduleRef.get(RestaurantsService);
  });

  it("maps restaurant rows into the shared domain shape", async () => {
    findMany.mockResolvedValue([misoEmberRow]);

    const restaurants = await service.list();

    expect(restaurants).toHaveLength(1);
    expect(restaurants[0]).toMatchObject({
      id: "miso-ember",
      menu: [{ id: "miso-ramen", priceCents: 1600 }],
      deals: [{ id: "miso-ember-percent-off-25", type: "PERCENT_OFF", percent: 20 }],
    });
  });

  it("filters by deal type at the database layer", async () => {
    findMany.mockResolvedValue([]);

    await service.list("BOGO");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deals: { some: { type: "BOGO" } } } }),
    );
  });

  it("returns null when a restaurant does not exist", async () => {
    findUnique.mockResolvedValue(null);

    const restaurant = await service.getById("missing");

    expect(restaurant).toBeNull();
  });
});

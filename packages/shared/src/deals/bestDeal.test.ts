import { describe, expect, it } from "vitest";

import { addLine, createEmptyCart } from "../cart";
import { SEED_RESTAURANTS } from "../seed/restaurants";

import { bestDeal, evaluateDeal } from "./bestDeal";

function findRestaurant(id: string) {
  const restaurant = SEED_RESTAURANTS.find((candidate) => candidate.id === id);
  if (!restaurant) throw new Error(`missing fixture restaurant ${id}`);
  return restaurant;
}

function findItem(restaurantId: string, itemId: string) {
  const item = findRestaurant(restaurantId).menu.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`missing fixture item ${itemId}`);
  return item;
}

describe("time window conditions", () => {
  const lotus = findRestaurant("lotus-dumpling");
  const deal = lotus.deals.find((candidate) => candidate.id === "lotus-dumpling-percent-off-afternoon");
  if (!deal) throw new Error("missing fixture deal");

  const context = (hour: number, minute: number) => ({
    lines: [],
    subtotalCents: 1000,
    now: new Date(2026, 0, 1, hour, minute),
    isFirstVisit: false,
  });

  it("is ineligible just before the window opens", () => {
    const evaluation = evaluateDeal(deal, context(13, 59));
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.reason).toBe("Not available at this time");
  });

  it("is eligible at the window's open boundary", () => {
    const evaluation = evaluateDeal(deal, context(14, 0));
    expect(evaluation.eligible).toBe(true);
  });

  it("is eligible just before the window closes", () => {
    const evaluation = evaluateDeal(deal, context(16, 59));
    expect(evaluation.eligible).toBe(true);
  });

  it("is ineligible at the window's close boundary", () => {
    const evaluation = evaluateDeal(deal, context(17, 0));
    expect(evaluation.eligible).toBe(false);
  });
});

describe("FIXED_PRICE_BUNDLE", () => {
  const taro = findRestaurant("taro-cloud");
  const deal = taro.deals.find((candidate) => candidate.id === "taro-cloud-2for9-afternoon");
  if (!deal) throw new Error("missing fixture deal");
  const milkTea = findItem("taro-cloud", "taro-milk-tea");
  const matchaLatte = findItem("taro-cloud", "matcha-latte");

  it("discounts the two eligible items down to the bundle price", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, milkTea);
    cart = addLine(cart, matchaLatte);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 1050,
      now: new Date(2026, 0, 1, 15, 0),
      isFirstVisit: false,
    });

    expect(evaluation.eligible).toBe(true);
    expect(evaluation.discountCents).toBe(150);
  });

  it("reports how many more items are needed below the bundle size", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, milkTea);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 550,
      now: new Date(2026, 0, 1, 15, 0),
      isFirstVisit: false,
    });

    expect(evaluation.discountCents).toBe(0);
    expect(evaluation.reason).toBe("Add 1 more eligible item to unlock");
  });
});

describe("FREE_ITEM with a trigger condition", () => {
  const cedarSalt = findRestaurant("cedar-salt");
  const deal = cedarSalt.deals.find((candidate) => candidate.id === "cedar-salt-free-hummus");
  if (!deal) throw new Error("missing fixture deal");
  const bowl = findItem("cedar-salt", "chicken-shawarma-bowl");
  const hummus = findItem("cedar-salt", "hummus");

  it("is ineligible without a qualifying bowl in the cart", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, hummus);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 500,
      now: new Date(),
      isFirstVisit: false,
    });

    expect(evaluation.eligible).toBe(false);
    expect(evaluation.reason).toBe("Add a qualifying item to unlock");
  });

  it("is eligible with zero discount when the bowl is present but hummus is not", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, bowl);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 1350,
      now: new Date(),
      isFirstVisit: false,
    });

    expect(evaluation.eligible).toBe(true);
    expect(evaluation.discountCents).toBe(0);
    expect(evaluation.reason).toBe("Add it to your order to get it free");
  });

  it("discounts the hummus to free once both are in the cart", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, bowl);
    cart = addLine(cart, hummus);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 1850,
      now: new Date(),
      isFirstVisit: false,
    });

    expect(evaluation.discountCents).toBe(500);
  });
});

describe("PERCENT_OFF restricted to eligible items", () => {
  const cedarSalt = findRestaurant("cedar-salt");
  const deal = cedarSalt.deals.find((candidate) => candidate.id === "cedar-salt-percent-off-bowls");
  if (!deal) throw new Error("missing fixture deal");
  const bowl = findItem("cedar-salt", "chicken-shawarma-bowl");
  const pita = findItem("cedar-salt", "pita-bread");

  it("only discounts the eligible bowl, not the whole subtotal", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, bowl);
    cart = addLine(cart, pita);

    const evaluation = evaluateDeal(deal, {
      lines: cart.lines,
      subtotalCents: 1600,
      now: new Date(),
      isFirstVisit: false,
    });

    expect(evaluation.discountCents).toBe(203);
  });
});

describe("bestDeal", () => {
  it("returns null applied and surfaces reasons when nothing is eligible", () => {
    const misoEmber = findRestaurant("miso-ember");
    const result = bestDeal(misoEmber.deals, {
      lines: [],
      subtotalCents: 0,
      now: new Date(2026, 0, 1, 12, 0),
      isFirstVisit: false,
    });

    expect(result.applied).toBeNull();
    expect(result.evaluations).toHaveLength(misoEmber.deals.length);
  });
});

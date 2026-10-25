import { describe, expect, it } from "vitest";

import { addLine, createEmptyCart } from "./cart";
import { computeQuote } from "./pricing";
import { SEED_RESTAURANTS } from "./seed/restaurants";

const misoEmber = SEED_RESTAURANTS.find((restaurant) => restaurant.id === "miso-ember");
if (!misoEmber) {
  throw new Error("fixture restaurant missing");
}

const misoRamen = misoEmber.menu.find((item) => item.id === "miso-ramen");
const gyoza = misoEmber.menu.find((item) => item.id === "crispy-pork-gyoza");
if (!misoRamen || !gyoza) {
  throw new Error("fixture menu items missing");
}

describe("computeQuote worked example", () => {
  it("matches the documented totals for ramen + gyoza with the 20% deal", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, misoRamen);
    cart = addLine(cart, gyoza);

    const quote = computeQuote(cart, misoEmber.deals, new Date("2026-01-01T12:00:00"), false);

    expect(quote.subtotalCents).toBe(2800);
    expect(quote.discountCents).toBe(560);
    expect(quote.taxCents).toBe(199);
    expect(quote.totalCents).toBe(2439);
    expect(quote.platformFeeCents).toBe(122);
    expect(quote.restaurantReceivesCents).toBe(2317);
    expect(quote.appliedDeal?.dealId).toBe("miso-ember-percent-off-25");
  });

  it("falls back to no deal below the subtotal threshold", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, misoRamen);

    const quote = computeQuote(cart, misoEmber.deals, new Date("2026-01-01T12:00:00"), false);

    expect(quote.discountCents).toBe(0);
    expect(quote.appliedDeal).toBeNull();
    const percentOffEvaluation = quote.dealEvaluations.find(
      (evaluation) => evaluation.dealId === "miso-ember-percent-off-25",
    );
    expect(percentOffEvaluation?.eligible).toBe(false);
    expect(percentOffEvaluation?.reason).toBe("Add $9.00 more to unlock");
  });

  it("picks the deal with the larger discount when several apply", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, misoRamen);
    cart = addLine(cart, gyoza);
    cart = addLine(cart, gyoza);

    const quote = computeQuote(cart, misoEmber.deals, new Date("2026-01-01T12:00:00"), true);

    expect(quote.appliedDeal?.dealId).toBe("miso-ember-bogo-gyoza");
    expect(quote.discountCents).toBe(1200);
  });
});

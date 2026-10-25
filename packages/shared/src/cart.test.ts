import { describe, expect, it } from "vitest";

import {
  addLine,
  belongsToDifferentRestaurant,
  cartItemCount,
  cartSubtotalCents,
  createEmptyCart,
  removeLine,
  setLineQuantity,
} from "./cart";
import { SEED_RESTAURANTS } from "./seed/restaurants";

const misoEmber = SEED_RESTAURANTS.find((restaurant) => restaurant.id === "miso-ember");
const lotus = SEED_RESTAURANTS.find((restaurant) => restaurant.id === "lotus-dumpling");
if (!misoEmber || !lotus) throw new Error("missing fixture restaurants");

const ramen = misoEmber.menu[0];
const dumplingPlate = lotus.menu.find((item) => item.id === "dumpling-plate");
if (!ramen || !dumplingPlate) throw new Error("missing fixture items");

describe("cart", () => {
  it("accumulates quantity when the same item is added twice", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, ramen);
    cart = addLine(cart, ramen);

    expect(cartItemCount(cart)).toBe(2);
    expect(cartSubtotalCents(cart)).toBe(3200);
  });

  it("flags a different restaurant before mutating the cart", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, ramen);

    expect(belongsToDifferentRestaurant(cart, lotus.id)).toBe(true);
    expect(() => addLine(cart, dumplingPlate)).toThrow();
  });

  it("clears the restaurant once the cart empties", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, ramen);
    cart = removeLine(cart, ramen.id);

    expect(cart.restaurantId).toBeNull();
    expect(cart.lines).toHaveLength(0);
  });

  it("removes the line when quantity is set to zero", () => {
    let cart = createEmptyCart();
    cart = addLine(cart, ramen);
    cart = setLineQuantity(cart, ramen.id, 0);

    expect(cart.lines).toHaveLength(0);
  });
});

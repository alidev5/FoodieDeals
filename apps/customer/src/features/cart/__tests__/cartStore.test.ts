import { createEmptyCart } from "@foodiedeals/shared";

import { useCartStore } from "../store/cartStore";

const ramen = {
  id: "miso-ramen",
  restaurantId: "miso-ember",
  name: "Miso Ramen",
  priceCents: 1600,
};

const dumplingPlate = {
  id: "dumpling-plate",
  restaurantId: "lotus-dumpling",
  name: "Dumpling Plate (12, mixed)",
  priceCents: 1800,
};

beforeEach(() => {
  useCartStore.setState({ cart: createEmptyCart(), pendingAddition: null });
});

describe("useCartStore", () => {
  it("adds an item to an empty cart", () => {
    useCartStore.getState().addItem(ramen);

    const { cart } = useCartStore.getState();
    expect(cart.restaurantId).toBe("miso-ember");
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.quantity).toBe(1);
  });

  it("opens the start-new-order sheet instead of mutating the cart across restaurants", () => {
    useCartStore.getState().addItem(ramen);
    useCartStore.getState().addItem(dumplingPlate);

    const { cart, pendingAddition } = useCartStore.getState();
    expect(cart.lines).toHaveLength(1);
    expect(pendingAddition?.menuItem.id).toBe("dumpling-plate");
  });

  it("replaces the cart when the new order is confirmed", () => {
    useCartStore.getState().addItem(ramen);
    useCartStore.getState().addItem(dumplingPlate);
    useCartStore.getState().confirmStartNewOrder();

    const { cart, pendingAddition } = useCartStore.getState();
    expect(cart.restaurantId).toBe("lotus-dumpling");
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.menuItem.id).toBe("dumpling-plate");
    expect(pendingAddition).toBeNull();
  });

  it("keeps the current cart when the new order is cancelled", () => {
    useCartStore.getState().addItem(ramen);
    useCartStore.getState().addItem(dumplingPlate);
    useCartStore.getState().cancelStartNewOrder();

    const { cart, pendingAddition } = useCartStore.getState();
    expect(cart.restaurantId).toBe("miso-ember");
    expect(cart.lines).toHaveLength(1);
    expect(pendingAddition).toBeNull();
  });

  it("clears the restaurant once the last item is removed", () => {
    useCartStore.getState().addItem(ramen);
    useCartStore.getState().removeItem(ramen.id);

    expect(useCartStore.getState().cart.restaurantId).toBeNull();
  });
});

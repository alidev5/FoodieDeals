import {
  addLine,
  belongsToDifferentRestaurant,
  createEmptyCart,
  removeLine,
  setLineQuantity,
  type Cart,
  type MenuItem,
} from "@foodiedeals/shared";
import { create } from "zustand";

interface PendingAddition {
  menuItem: MenuItem;
}

interface CartState {
  cart: Cart;
  pendingAddition: PendingAddition | null;
  addItem: (menuItem: MenuItem) => void;
  confirmStartNewOrder: () => void;
  cancelStartNewOrder: () => void;
  removeItem: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: createEmptyCart(),
  pendingAddition: null,

  addItem: (menuItem) => {
    const { cart } = get();
    if (belongsToDifferentRestaurant(cart, menuItem.restaurantId)) {
      set({ pendingAddition: { menuItem } });
      return;
    }
    set({ cart: addLine(cart, menuItem) });
  },

  confirmStartNewOrder: () => {
    const { pendingAddition } = get();
    if (!pendingAddition) return;
    set({ cart: addLine(createEmptyCart(), pendingAddition.menuItem), pendingAddition: null });
  },

  cancelStartNewOrder: () => set({ pendingAddition: null }),

  removeItem: (menuItemId) => set((state) => ({ cart: removeLine(state.cart, menuItemId) })),

  setQuantity: (menuItemId, quantity) =>
    set((state) => ({ cart: setLineQuantity(state.cart, menuItemId, quantity) })),

  clearCart: () => set({ cart: createEmptyCart() }),
}));

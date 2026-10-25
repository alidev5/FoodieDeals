import { cartItemCount, cartSubtotalCents } from "@foodiedeals/shared";

import { useCartStore } from "./cartStore";

export function useCartLines() {
  return useCartStore((state) => state.cart.lines);
}

export function useCartItemCount() {
  return useCartStore((state) => cartItemCount(state.cart));
}

export function useCartSubtotalCents() {
  return useCartStore((state) => cartSubtotalCents(state.cart));
}

export function usePendingAddition() {
  return useCartStore((state) => state.pendingAddition);
}

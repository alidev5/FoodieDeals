import { computeQuote, type Quote } from "@foodiedeals/shared";
import { useMemo } from "react";

import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { useCartStore } from "../../cart/store";
import { useRestaurant } from "../../catalog/hooks";

export function useQuote(): Quote | null {
  const cart = useCartStore((state) => state.cart);
  const debouncedCart = useDebouncedValue(cart, 150);
  const { data: restaurant } = useRestaurant(debouncedCart.restaurantId ?? undefined);

  return useMemo(() => {
    if (!restaurant || debouncedCart.lines.length === 0) {
      return null;
    }
    // Server-side order history will supply this once checkout exists; until then,
    // first-visit deals are always shown as available in the local fixture.
    const isFirstVisit = true;
    return computeQuote(debouncedCart, restaurant.deals, new Date(), isFirstVisit);
  }, [restaurant, debouncedCart]);
}

import { bestDeal, type Restaurant } from "@foodiedeals/shared";
import { useMemo } from "react";

import { useCartStore } from "../../cart/store";

export function useDealEvaluations(restaurant: Restaurant | undefined | null) {
  const cart = useCartStore((state) => state.cart);

  return useMemo(() => {
    if (!restaurant) return [];

    const lines = cart.restaurantId === restaurant.id ? cart.lines : [];
    const subtotalCents = lines.reduce((sum, line) => sum + line.menuItem.priceCents * line.quantity, 0);

    const { evaluations } = bestDeal(restaurant.deals, {
      lines,
      subtotalCents,
      now: new Date(),
      isFirstVisit: true,
    });

    return evaluations;
  }, [restaurant, cart]);
}

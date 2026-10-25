import { cartSubtotalCents, type Cart } from "./cart";
import type { Deal } from "./catalog";
import { bestDeal, type DealEvaluation } from "./deals";
import {
  addCents,
  percentOfCents,
  roundHalfUpToCents,
  subtractCents,
  PLATFORM_FEE_RATE,
  SALES_TAX_RATE,
  type Cents,
} from "./money";

export interface Quote {
  subtotalCents: Cents;
  discountCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
  platformFeeCents: Cents;
  restaurantReceivesCents: Cents;
  appliedDeal: DealEvaluation | null;
  dealEvaluations: DealEvaluation[];
}

export function computeQuote(cart: Cart, deals: Deal[], now: Date, isFirstVisit: boolean): Quote {
  const subtotalCents = cartSubtotalCents(cart);
  const { applied, evaluations } = bestDeal(deals, {
    lines: cart.lines,
    subtotalCents,
    now,
    isFirstVisit,
  });

  const discountCents = applied?.discountCents ?? 0;
  const discountedSubtotalCents = subtractCents(subtotalCents, discountCents);
  const taxCents = roundHalfUpToCents(discountedSubtotalCents * SALES_TAX_RATE);
  const totalCents = addCents(subtractCents(subtotalCents, discountCents), taxCents);
  const platformFeeCents = percentOfCents(totalCents, PLATFORM_FEE_RATE * 100);
  const restaurantReceivesCents = subtractCents(totalCents, platformFeeCents);

  return {
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    platformFeeCents,
    restaurantReceivesCents,
    appliedDeal: applied,
    dealEvaluations: evaluations,
  };
}

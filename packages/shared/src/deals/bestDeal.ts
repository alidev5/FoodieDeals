import type { Deal } from "../catalog";

import { evaluateBogo } from "./strategies/bogo";
import { evaluateFixedPriceBundle } from "./strategies/fixedPriceBundle";
import { evaluateFreeItem } from "./strategies/freeItem";
import { evaluatePercentOff } from "./strategies/percentOff";
import type { DealEvaluation, DealEvaluationContext } from "./types";

export function evaluateDeal(deal: Deal, context: DealEvaluationContext): DealEvaluation {
  switch (deal.type) {
    case "BOGO":
      return evaluateBogo(deal, context);
    case "PERCENT_OFF":
      return evaluatePercentOff(deal, context);
    case "FREE_ITEM":
      return evaluateFreeItem(deal, context);
    case "FIXED_PRICE_BUNDLE":
      return evaluateFixedPriceBundle(deal, context);
  }
}

export interface BestDealResult {
  applied: DealEvaluation | null;
  evaluations: DealEvaluation[];
}

export function bestDeal(deals: Deal[], context: DealEvaluationContext): BestDealResult {
  const evaluations = deals.map((deal) => evaluateDeal(deal, context));

  const applied = evaluations
    .filter((evaluation) => evaluation.eligible && evaluation.discountCents > 0)
    .sort((a, b) => b.discountCents - a.discountCents)[0];

  return { applied: applied ?? null, evaluations };
}

import type { Deal } from "../../catalog";
import { addCents, subtractCents } from "../../money";
import { checkBaseConditions } from "../conditions";
import type { DealEvaluation, DealEvaluationContext } from "../types";

function expandEligibleUnitPrices(
  deal: Deal & { type: "FIXED_PRICE_BUNDLE" },
  context: DealEvaluationContext,
): number[] {
  const eligible = new Set(deal.eligibleItemIds);
  const unitPrices: number[] = [];
  for (const line of context.lines) {
    if (eligible.has(line.menuItem.id)) {
      for (let i = 0; i < line.quantity; i++) {
        unitPrices.push(line.menuItem.priceCents);
      }
    }
  }
  return unitPrices.sort((a, b) => b - a);
}

export function evaluateFixedPriceBundle(
  deal: Deal & { type: "FIXED_PRICE_BUNDLE" },
  context: DealEvaluationContext,
): DealEvaluation {
  const base = checkBaseConditions(deal.conditions, context);
  if (!base.ok) {
    return { dealId: deal.id, dealName: deal.name, eligible: false, discountCents: 0, reason: base.reason };
  }

  const unitPrices = expandEligibleUnitPrices(deal, context);
  const bundleCount = Math.floor(unitPrices.length / deal.bundleSize);
  if (bundleCount < 1) {
    const remaining = deal.bundleSize - unitPrices.length;
    return {
      dealId: deal.id,
      dealName: deal.name,
      eligible: true,
      discountCents: 0,
      reason: `Add ${remaining} more eligible item${remaining === 1 ? "" : "s"} to unlock`,
    };
  }

  const itemsInBundles = unitPrices.slice(0, bundleCount * deal.bundleSize);
  const regularPriceCents = addCents(...itemsInBundles);
  const bundlePriceCents = deal.bundlePriceCents * bundleCount;
  const discountCents = Math.max(0, subtractCents(regularPriceCents, bundlePriceCents));

  return { dealId: deal.id, dealName: deal.name, eligible: true, discountCents };
}

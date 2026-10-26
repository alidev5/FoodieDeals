import type { Deal } from "../../catalog";
import { addCents } from "../../money";
import { checkBaseConditions } from "../conditions";
import type { DealEvaluation, DealEvaluationContext } from "../types";

function expandEligibleUnitPrices(
  deal: Deal & { type: "BOGO" },
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

export function evaluateBogo(
  deal: Deal & { type: "BOGO" },
  context: DealEvaluationContext,
): DealEvaluation {
  const base = checkBaseConditions(deal.conditions, context);
  if (!base.ok) {
    return {
      dealId: deal.id,
      dealName: deal.name,
      eligible: false,
      discountCents: 0,
      reason: base.reason,
    };
  }

  const unitPrices = expandEligibleUnitPrices(deal, context);
  if (unitPrices.length < 2) {
    return {
      dealId: deal.id,
      dealName: deal.name,
      eligible: true,
      discountCents: 0,
      reason: "Add one more eligible item to get one free",
    };
  }

  const freeUnitPrices: number[] = [];
  for (let i = 1; i < unitPrices.length; i += 2) {
    freeUnitPrices.push(unitPrices[i] as number);
  }

  return {
    dealId: deal.id,
    dealName: deal.name,
    eligible: true,
    discountCents: addCents(...freeUnitPrices),
  };
}

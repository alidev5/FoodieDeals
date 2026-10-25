import type { Deal } from "../../catalog";
import { checkBaseConditions } from "../conditions";
import type { DealEvaluation, DealEvaluationContext } from "../types";

export function evaluateFreeItem(
  deal: Deal & { type: "FREE_ITEM" },
  context: DealEvaluationContext,
): DealEvaluation {
  const base = checkBaseConditions(deal.conditions, context);
  if (!base.ok) {
    return { dealId: deal.id, dealName: deal.name, eligible: false, discountCents: 0, reason: base.reason };
  }

  if (deal.conditions.eligibleItemIds) {
    const trigger = new Set(deal.conditions.eligibleItemIds);
    const hasTriggerItem = context.lines.some((line) => trigger.has(line.menuItem.id));
    if (!hasTriggerItem) {
      return {
        dealId: deal.id,
        dealName: deal.name,
        eligible: false,
        discountCents: 0,
        reason: "Add a qualifying item to unlock",
      };
    }
  }

  const line = context.lines.find((candidate) => candidate.menuItem.id === deal.freeItemId);
  if (!line) {
    return {
      dealId: deal.id,
      dealName: deal.name,
      eligible: true,
      discountCents: 0,
      reason: "Add it to your order to get it free",
    };
  }

  return { dealId: deal.id, dealName: deal.name, eligible: true, discountCents: line.menuItem.priceCents };
}

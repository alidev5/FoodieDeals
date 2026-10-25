import type { Deal } from "../../catalog";
import { addCents, percentOfCents } from "../../money";
import { checkBaseConditions } from "../conditions";
import type { DealEvaluation, DealEvaluationContext } from "../types";

function eligibleBaseCents(
  deal: Deal & { type: "PERCENT_OFF" },
  context: DealEvaluationContext,
): number {
  if (!deal.conditions.eligibleItemIds) {
    return context.subtotalCents;
  }
  const eligible = new Set(deal.conditions.eligibleItemIds);
  const eligibleLineTotals = context.lines
    .filter((line) => eligible.has(line.menuItem.id))
    .map((line) => line.menuItem.priceCents * line.quantity);
  return addCents(...eligibleLineTotals);
}

export function evaluatePercentOff(
  deal: Deal & { type: "PERCENT_OFF" },
  context: DealEvaluationContext,
): DealEvaluation {
  const base = checkBaseConditions(deal.conditions, context);
  if (!base.ok) {
    return { dealId: deal.id, dealName: deal.name, eligible: false, discountCents: 0, reason: base.reason };
  }

  const baseCents = eligibleBaseCents(deal, context);
  if (baseCents === 0) {
    return {
      dealId: deal.id,
      dealName: deal.name,
      eligible: true,
      discountCents: 0,
      reason: "Add an eligible item to unlock",
    };
  }

  const discountCents = percentOfCents(baseCents, deal.percent);
  return { dealId: deal.id, dealName: deal.name, eligible: true, discountCents };
}

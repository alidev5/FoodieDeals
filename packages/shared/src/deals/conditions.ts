import type { DealConditions } from "../catalog";

import { formatDollarsFromCents, minutesSinceMidnight, type DealEvaluationContext } from "./types";

export function checkBaseConditions(
  conditions: DealConditions,
  context: DealEvaluationContext,
): { ok: true } | { ok: false; reason: string } {
  if (conditions.minSubtotalCents && context.subtotalCents < conditions.minSubtotalCents) {
    const remaining = conditions.minSubtotalCents - context.subtotalCents;
    return { ok: false, reason: `Add ${formatDollarsFromCents(remaining)} more to unlock` };
  }

  if (conditions.timeWindow) {
    const nowMinutes = minutesSinceMidnight(context.now);
    const { startMinute, endMinute } = conditions.timeWindow;
    if (nowMinutes < startMinute || nowMinutes >= endMinute) {
      return { ok: false, reason: "Not available at this time" };
    }
  }

  if (conditions.firstVisitOnly && !context.isFirstVisit) {
    return { ok: false, reason: "Only available on your first visit" };
  }

  return { ok: true };
}

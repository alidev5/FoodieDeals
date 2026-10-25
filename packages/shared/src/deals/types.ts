import type { CartLine } from "../cart";
import type { Cents } from "../money";

export interface DealEvaluationContext {
  lines: CartLine[];
  subtotalCents: Cents;
  now: Date;
  isFirstVisit: boolean;
}

export interface DealEvaluation {
  dealId: string;
  dealName: string;
  eligible: boolean;
  discountCents: Cents;
  reason?: string;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatDollarsFromCents(cents: Cents): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export type Cents = number;

export const SALES_TAX_RATE = 0.08875;
export const PLATFORM_FEE_RATE = 0.05;

export function roundHalfUpToCents(value: number): Cents {
  return Math.floor(value + 0.5);
}

export function percentOfCents(cents: Cents, percent: number): Cents {
  return roundHalfUpToCents(cents * (percent / 100));
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((sum, value) => sum + value, 0);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return a - b;
}

export function formatCents(cents: Cents): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  return `${sign}$${dollars}.${remainder.toString().padStart(2, "0")}`;
}

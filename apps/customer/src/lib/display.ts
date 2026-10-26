import type { Deal, MenuItem, Restaurant } from "@foodiedeals/shared";
import type { IconName } from "@foodiedeals/ui-native";

export function initials(name: string, max = 3): string {
  return name
    .split(/\s+/)
    .filter((word) => word === "&" || /^[A-Za-z]/.test(word))
    .filter((word) => !["Kitchen", "House", "Bar"].includes(word))
    .map((word) => (word === "&" ? "&" : word[0]!.toUpperCase()))
    .join("")
    .slice(0, max);
}

/** "214 Ludlow St, New York, NY" -> "Ludlow St" */
export function streetName(address: string | undefined): string | null {
  const firstLine = address?.split(",")[0]?.trim();
  if (!firstLine) return null;
  return firstLine.replace(/^[\d-]+\s+/, "");
}

/** "214 Ludlow St, New York, NY" -> "214 Ludlow St" */
export function streetAddress(address: string | undefined | null): string | null {
  return address?.split(",")[0]?.trim() || null;
}

/** "214 Ludlow St, New York, NY" -> "New York, NY" */
export function cityName(address: string | undefined): string | null {
  const parts = address?.split(",").map((part) => part.trim()) ?? [];
  return parts.length >= 3 ? parts.slice(1).join(", ") : null;
}

export function prepRange(
  restaurant: Pick<Restaurant, "prepMinutesMin" | "prepMinutesMax">,
): string | null {
  const { prepMinutesMin: min, prepMinutesMax: max } = restaurant;
  if (min && max && min !== max) return `${min}–${max} min`;
  if (max ?? min) return `${max ?? min} min`;
  return null;
}

export function priceLevelLabel(level: number | undefined): string | null {
  return level ? "$".repeat(level) : null;
}

export function formatMinuteOfDay(minute: number): string {
  const hours24 = Math.floor(minute / 60) % 24;
  const minutes = minute % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return minutes === 0
    ? `${hours12} ${suffix}`
    : `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatClockTime(date: Date): string {
  return formatMinuteOfDay(date.getHours() * 60 + date.getMinutes());
}

/** "Miso & Ember Kitchen" -> "Miso & Ember", for tight spots like the order tracker. */
export function shortRestaurantName(name: string): string {
  return name.replace(/\s+(Kitchen|House|Bar)$/, "");
}

/** "20% off orders over $25" -> "20% off"; other deal names are returned as-is. */
export function shortDealName(name: string): string {
  return name.match(/^\d+% off/)?.[0] ?? name;
}

export function dealIcon(deal: Pick<Deal, "type">): IconName {
  switch (deal.type) {
    case "PERCENT_OFF":
      return "percent";
    case "BOGO":
      return "gift";
    case "FREE_ITEM":
      return "gift";
    case "FIXED_PRICE_BUNDLE":
      return "layers";
  }
}

/** Short headline for a deal's square badge: "20%", "FREE", "1+1", "2×$9". */
export function dealBadgeText(deal: Deal): string {
  switch (deal.type) {
    case "PERCENT_OFF":
      return `${deal.percent}%`;
    case "BOGO":
      return "1+1";
    case "FREE_ITEM":
      return "FREE";
    case "FIXED_PRICE_BUNDLE":
      return `${deal.bundleSize}×$${Math.round(deal.bundlePriceCents / 100)}`;
  }
}

/** The conditions line under a deal: "On orders over $35 · 2–5 PM · First visit". */
export function dealConditionsText(deal: Deal): string {
  const parts: string[] = [];
  const { minSubtotalCents, timeWindow, firstVisitOnly } = deal.conditions;
  const minLabel = minSubtotalCents ? `${(minSubtotalCents / 100).toFixed(0)}` : null;
  // Skip the minimum when the deal's name already states it, e.g. "20% off orders over $25".
  const nameStatesMinimum =
    deal.type === "PERCENT_OFF" && minLabel !== null && deal.name.includes(minLabel);
  if (minLabel && !nameStatesMinimum) parts.push(`On orders over ${minLabel}`);
  if (timeWindow) {
    parts.push(
      `${formatMinuteOfDay(timeWindow.startMinute)}–${formatMinuteOfDay(timeWindow.endMinute)}`,
    );
  }
  if (firstVisitOnly) parts.push("First visit");
  if (parts.length === 0) parts.push("Pickup only", "All day");
  return parts.join(" · ");
}

/** A short tag for menu items that a deal applies to, e.g. "Free over $35" or "1+1 first visit". */
export function menuItemDealTag(menuItem: MenuItem, deals: Deal[]): string | null {
  for (const deal of deals) {
    if (deal.type === "FREE_ITEM" && deal.freeItemId === menuItem.id) {
      const min = deal.conditions.minSubtotalCents;
      return min ? `Free over $${(min / 100).toFixed(0)}` : "Free with a deal";
    }
    if (deal.type === "BOGO" && deal.eligibleItemIds.includes(menuItem.id)) {
      return deal.conditions.firstVisitOnly ? "1+1 first visit" : "Buy 1 get 1";
    }
    if (deal.type === "FIXED_PRICE_BUNDLE" && deal.eligibleItemIds.includes(menuItem.id)) {
      return `${deal.bundleSize} for $${(deal.bundlePriceCents / 100).toFixed(0)}`;
    }
    if (deal.type === "PERCENT_OFF" && deal.conditions.eligibleItemIds?.includes(menuItem.id)) {
      return `${deal.percent}% off`;
    }
  }
  return null;
}

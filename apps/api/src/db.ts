import postgres from "postgres";

export type Sql = postgres.Sql;
export type TransactionSql = postgres.TransactionSql;

export function createSql(databaseUrl: string): Sql {
  return postgres(databaseUrl, {
    // Supabase's pooler runs in transaction mode, which can't hold prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    onnotice: () => {},
  });
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export interface RestaurantRow {
  id: string;
  name: string;
  demoKey: string;
  cuisine: string;
  isOpen: boolean;
  heroPhoto: string | null;
  address: string | null;
  phone: string | null;
  stripeAccountId: string | null;
  prepMinutesMin: number | null;
  prepMinutesMax: number | null;
  priceLevel: number | null;
  closesAtMinute: number | null;
}

export interface MenuItemRow {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  priceCents: number;
  photo: string | null;
}

export interface DealRow {
  id: string;
  restaurantId: string;
  name: string;
  type: "BOGO" | "PERCENT_OFF" | "FREE_ITEM" | "FIXED_PRICE_BUNDLE";
  percent: number | null;
  freeItemId: string | null;
  bundleSize: number | null;
  bundlePriceCents: number | null;
  eligibleItemIds: string[] | null;
  minSubtotalCents: number | null;
  timeWindowStart: number | null;
  timeWindowEnd: number | null;
  firstVisitOnly: boolean | null;
}

export interface CustomerRow {
  id: string;
  deviceId: string;
  pickupName: string;
  createdAt: Date;
}

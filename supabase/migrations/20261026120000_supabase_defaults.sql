-- Ids and updatedAt used to be filled in by Prisma; the database now owns them.
ALTER TABLE "Restaurant" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "MenuItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Deal" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Customer" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "CheckoutSession" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "DailyOrderCounter" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "Restaurant" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Order" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Every timestamp was written as UTC; store it with its zone so clients in any zone read it back correctly.
ALTER TABLE "Restaurant"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "Customer"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Order"
  ALTER COLUMN "orderDate" TYPE TIMESTAMPTZ(3) USING "orderDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "acceptedAt" TYPE TIMESTAMPTZ(3) USING "acceptedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "readyAt" TYPE TIMESTAMPTZ(3) USING "readyAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "pickedUpAt" TYPE TIMESTAMPTZ(3) USING "pickedUpAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "paidOutAt" TYPE TIMESTAMPTZ(3) USING "paidOutAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "CheckoutSession"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "ProcessedStripeEvent"
  ALTER COLUMN "processedAt" TYPE TIMESTAMPTZ(3) USING "processedAt" AT TIME ZONE 'UTC';
ALTER TABLE "DailyOrderCounter"
  ALTER COLUMN "date" TYPE TIMESTAMPTZ(3) USING "date" AT TIME ZONE 'UTC';

-- Only the API (which connects as the database owner) touches these tables. With RLS on and no
-- policies, Supabase's public REST endpoint can't read or write them with the anon key.
ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MenuItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedStripeEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyOrderCounter" ENABLE ROW LEVEL SECURITY;

import { SEED_RESTAURANTS } from "@foodiedeals/shared";
import postgres from "postgres";
import Stripe from "stripe";

import { requireDatabaseUrl } from "./paths";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY must be set to run stripe:setup");
}
if (!stripeSecretKey.startsWith("sk_test_")) {
  throw new Error("stripe:setup only runs against Stripe test-mode secret keys (sk_test_...)");
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });
const sql = postgres(requireDatabaseUrl(), { onnotice: () => {} });

async function createTestConnectedAccount(restaurantName: string): Promise<string> {
  const email = `${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@foodiedeals.test`;
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    business_type: "individual",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      mcc: "5812",
      product_description: "Restaurant pickup orders",
      url: "https://foodiedeals.test",
    },
    individual: {
      first_name: "Demo",
      last_name: "Owner",
      email,
      phone: "+15555550100",
      dob: { day: 1, month: 1, year: 1990 },
      ssn_last_4: "0000",
      address: {
        line1: "address_full_match",
        city: "New York",
        state: "NY",
        postal_code: "10002",
        country: "US",
      },
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "127.0.0.1",
    },
    external_account: {
      object: "bank_account",
      country: "US",
      currency: "usd",
      account_holder_type: "individual",
      routing_number: "110000000",
      account_number: "000123456789",
    },
  });

  return account.id;
}

async function main() {
  for (const restaurant of SEED_RESTAURANTS) {
    const [existing] = await sql<{ stripeAccountId: string | null }[]>`
      SELECT "stripeAccountId" FROM "Restaurant" WHERE "id" = ${restaurant.id}`;

    if (!existing) {
      console.warn(`Skipping ${restaurant.name}: not found in the database. Run db:seed first.`);
      continue;
    }
    if (existing.stripeAccountId) {
      console.log(
        `${restaurant.name} already has a connected account: ${existing.stripeAccountId}`,
      );
      continue;
    }

    const accountId = await createTestConnectedAccount(restaurant.name);
    await sql`
      UPDATE "Restaurant" SET "stripeAccountId" = ${accountId}, "updatedAt" = now()
      WHERE "id" = ${restaurant.id}`;
    console.log(`Created connected account for ${restaurant.name}: ${accountId}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());

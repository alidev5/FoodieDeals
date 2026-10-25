# Payments

FoodieDeals uses [Stripe Connect](https://stripe.com/docs/connect) with
**destination charges**: the customer pays the full total to the platform's
Stripe account, Stripe automatically transfers the restaurant's share
(`total - platform fee`) to the restaurant's connected account, and the
platform fee (5% of the total) stays with the platform account.

Everything below is test mode. Nothing here works with a live secret key,
and `stripe:setup` refuses to run against anything but an `sk_test_...` key.

## One-time setup

1. Create (or open) a Stripe account and switch to **test mode**.
2. Copy your test secret key (`sk_test_...`) and publishable key
   (`pk_test_...`) from the Stripe Dashboard's API keys page.
3. Set `STRIPE_SECRET_KEY` in `apps/api/.env` and
   `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `apps/customer/.env`.
4. Run `pnpm --filter api run stripe:setup`. This creates one test Connect
   **custom** account per seeded restaurant, using Stripe's test-mode magic
   values (`ssn_last_4: "0000"`, the test bank account/routing numbers, an
   `address.line1` of `address_full_match`) so each account comes back fully
   verified and able to receive transfers without a real onboarding flow.
   It's idempotent — rerunning it skips any restaurant that already has a
   `stripeAccountId`.
5. Set up the webhook so Stripe can reach your local API:
   - Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
   - Run `stripe listen --forward-to localhost:3000/payments/webhook`.
   - Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in
     `apps/api/.env` and restart the API.

## Testing a payment end to end

1. `pnpm dev`, open the customer app, add items from an open restaurant, go
   to checkout, tap Pay.
2. In the PaymentSheet, use card `4242 4242 4242 4242`, any future expiry,
   any 3-digit CVC, any ZIP.
3. Stripe charges the test card, fires `payment_intent.succeeded`, your
   `stripe listen` process forwards it to `/payments/webhook`, and the API
   creates the order inside one transaction (idempotent on the Stripe event
   id, so a duplicate webhook delivery never double-creates an order).
4. The customer app polls `GET /orders/by-payment-intent/:id` with backoff
   until the order exists, then shows the live Pickup screen.
5. The restaurant app (joined to `restaurant:{id}`) gets `order:created`
   instantly, highlights the new order, and plays a chime.

To skip the real PaymentSheet (useful for testing the webhook/order-creation
path in isolation), run:

```bash
pnpm --filter api run webhook:dev-test
```

This builds a realistic `payment_intent.succeeded` event for Miso & Ember
Kitchen's ramen + gyoza (the worked example — $24.39 total), signs it with
your `STRIPE_WEBHOOK_SECRET`, and posts it straight to a running API.

## Why destination charges, not direct charges

A direct charge would put the PaymentIntent on the restaurant's connected
account, which means the platform fee has to be collected as a separate
transfer and the platform never actually holds the funds. A destination
charge keeps the PaymentIntent (and the Stripe test card decline/dispute
handling that comes with it) on the platform account, which is simpler to
reason about for a pickup app where the platform, not the restaurant, is the
merchant of record for the customer.

## What stripe:setup cannot do for you

A real production launch needs actual restaurant owners to complete Stripe's
real onboarding (identity verification, a real bank account) — the test-mode
magic values here only work in test mode. `stripe:setup` exists to make the
demo and local development possible without that, not to replace it.

# 0002: Orders are created only by the Stripe webhook

## Status

Accepted.

## Context

The obvious alternative is to create the `Order` row from the client right
after `presentPaymentSheet()` resolves successfully. That's simpler to wire,
but it means trusting the client's word that payment succeeded. A client can
crash, lose connectivity, or simply lie between the PaymentSheet resolving
and the order-creation request landing — any of those leaves either a paid
order that was never recorded, or (worse, if the client is trusted at all) a
recorded order that was never actually paid for.

## Decision

The client never creates an order. `POST /checkout/payment-intent` creates a
Stripe PaymentIntent and a `CheckoutSession` row, and that's all. The order
itself is created exclusively inside the `payment_intent.succeeded` webhook
handler, inside one database transaction that also claims idempotency
(`ProcessedStripeEvent`, keyed by the Stripe event id) and assigns the daily
order number (`DailyOrderCounter`). If that transaction's
`ProcessedStripeEvent` insert collides with a row that already exists — a
duplicate webhook delivery, which Stripe's own docs say to expect — the
handler returns without creating a second order.

The client's job after paying is only to ask "has the webhook created my
order yet?", via `GET /orders/by-payment-intent/:id` polled with backoff.

## Consequences

- An order existing is proof Stripe actually confirmed the charge — there is
  no code path that creates an `Order` without a successful PaymentIntent.
- The client has to tolerate a short "Confirming payment" window while the
  webhook catches up, instead of transitioning instantly.
- Webhook idempotency has to be handled once, correctly, in one place —
  rather than every caller of an order-creation endpoint needing to reason
  about duplicate submissions. See `webhook.e2e-spec.ts` for the
  double-delivery test.
- Local development needs a way to receive webhooks (the Stripe CLI's
  `stripe listen`, or the bundled `webhook:dev-test` script for testing
  without a real payment) — see `docs/PAYMENTS.md`.

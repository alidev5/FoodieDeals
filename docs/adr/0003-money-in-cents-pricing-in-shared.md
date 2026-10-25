# 0003: Money is integer cents everywhere; pricing logic lives in packages/shared

## Status

Accepted.

## Context

This app touches money in five different places: the customer app's live
checkout preview, the server's authoritative checkout quote, the Stripe
PaymentIntent amount, the order row persisted from the webhook, and the
restaurant app's payout display. Floating-point dollars (`24.39`) accumulate
rounding error across repeated arithmetic and are exactly the kind of bug
that's invisible in a demo and expensive in production — a one-cent drift
between what the customer was quoted and what Stripe actually charged.

Pricing rules (tax, deal discounts, platform fee) are also not trivial: four
deal types with their own eligibility conditions, a largest-discount-wins
rule, half-up rounding at each step. Implementing that twice — once for the
live client preview, once for the server's authoritative quote — would mean
two implementations that could silently diverge.

## Decision

Every money value is a plain integer number of cents, from the Prisma schema
(`Int` columns, never `Decimal` or `Float`) through the API response to the
Zustand cart state. The only function that ever turns a cents integer into a
display string is `formatCents` in `packages/shared`, called from UI
components and nowhere else. Rounding uses a single `roundHalfUpToCents`
helper (`Math.floor(value + 0.5)`), so every rounding decision in the app —
tax, discounts, the platform fee — goes through the same rule.

All pricing logic — `computeQuote`, the four deal-type strategies, `bestDeal`
— lives in `packages/shared` and is imported, not reimplemented, by both the
customer app (for the live checkout preview) and the API's `checkout`
module (for the authoritative quote used to create the PaymentIntent). The
worked example in `docs/ENGINEERING.md` ($28.00 → $24.39, platform fee $1.22,
restaurant receives $23.17) is asserted as a test in three places —
`packages/shared`'s pricing tests, the API's checkout service tests, and the
webhook e2e test — specifically so the three call sites can never quietly
disagree.

## Consequences

- No currency library is needed; cents are just integers and ordinary
  integer arithmetic is exact.
- A change to a pricing rule (say, a new deal type) is a change in exactly
  one package, and both Expo apps and the API pick it up as soon as
  `packages/shared` is rebuilt.
- Every money-bearing field in the Prisma schema, every API response, and
  every socket payload is typed as a number of cents — a reviewer can trust
  that a `Cents` value is never secretly a dollar amount a few call sites
  away from a `formatCents`.

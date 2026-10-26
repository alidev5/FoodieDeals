# FoodieDeals

A deals-first food pickup app: customers browse nearby restaurant deals, pay in
app, and collect at the counter; restaurants track and advance paid orders in
real time.

## Layout

- `apps/customer` — Expo customer app (phone).
- `apps/restaurant` — Expo restaurant app (tablet, also runs in a browser).
- `apps/api` — NestJS API, Socket.IO, Prisma/PostgreSQL, Stripe (charges settle on the platform account; restaurants are paid out manually for now).
- `packages/shared` — domain logic: money, pricing, deals, order state machine,
  realtime event contracts.
- `packages/ui-native` — shared React Native components, theme, API client and
  socket provider used by both Expo apps.
- `design/` — design tokens and Figma reference notes.
- `docs/` — architecture, API, payments, realtime and demo documentation.

Full product, architecture, design, and code-standard rules live in
[`docs/ENGINEERING.md`](./docs/ENGINEERING.md).

## Prerequisites

- Node 20 (see `.nvmrc`)
- pnpm 10
- Docker (for local Postgres)
- A Stripe account in **test mode** (for payments — see
  [docs/PAYMENTS.md](./docs/PAYMENTS.md))
- Expo Go on a phone, or Android/iOS simulators, to run the mobile apps

## Setup

```bash
pnpm install
docker-compose up -d

cp apps/api/.env.example apps/api/.env
# edit apps/api/.env and set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET to your
# own Stripe test-mode values (see docs/PAYMENTS.md)

pnpm --filter api exec prisma migrate dev
pnpm --filter api run seed

cp apps/customer/.env.example apps/customer/.env
cp apps/restaurant/.env.example apps/restaurant/.env
# set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in apps/customer/.env
```

The local Postgres container publishes on host port **5433**, not 5432, so it
doesn't collide with a Postgres you may already have installed natively. CI
uses its own disposable Postgres service on the default port, so this only
matters for local development.

If you're testing on a physical phone, set `EXPO_PUBLIC_API_URL` in both
`.env` files to your machine's LAN IP (e.g. `http://192.168.1.20:3000`)
instead of `localhost`, since the phone can't resolve your laptop's
`localhost`.

## Running

```bash
pnpm dev
```

Runs every workspace's `dev` script through Turborepo: the Nest API on
`:3000`, the customer app's Expo CLI, and the restaurant app's Expo CLI. Press
`w` in either app's Expo CLI (or run `pnpm --filter <app> run web`) to open
it in a browser instead of a simulator/device. The API enables CORS outside
production so the web builds can reach it.

## Testing payments end to end

On the phone the card is entered in Stripe's PaymentSheet; in the browser the
checkout shows Stripe Elements card fields. Either way, use Stripe's test card
`4242 4242 4242 4242`, any future expiry and any CVC (`4000 0027 6000 3184`
triggers 3D Secure, `4000 0000 0000 9995` is declined).

After Stripe confirms the payment the app calls
`POST /payments/intents/:id/sync`, which reads the intent back from Stripe and
creates the order through the same idempotent path as the webhook. Payments
therefore complete even when `stripe listen` isn't running; the webhook stays
the primary path when it is. See [docs/PAYMENTS.md](./docs/PAYMENTS.md) for
webhook forwarding, and `apps/api/scripts/send-test-webhook.ts` for sending a
signed test event without a real payment.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm turbo run test:e2e   # apps/api Supertest + Socket.IO integration tests
```

Each fans out to every workspace via Turborepo. The e2e suite needs the local
Postgres container running and a migrated, Stripe-configured `apps/api/.env`
(it overrides the Stripe client with a fake in-process double, so it never
calls the real Stripe API).

## Useful scripts

| Command                                                  | What it does                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm --filter api run seed`                             | Seeds the five demo restaurants, menus and deals                                          |
| `pnpm --filter api run webhook:dev-test`                 | Sends one signed `payment_intent.succeeded` event to a running API, creating a real order |
| `pnpm --filter api run payouts:mark-paid <restaurantId>` | Marks a restaurant's picked-up orders as paid out after you've sent its share             |
| `pnpm --filter api run stripe:setup`                     | Creates Stripe test Connect accounts (only needed once automatic payouts are switched on) |
| `pnpm --filter api exec prisma studio`                   | Browse the database                                                                       |

## Demo accounts

Customer app: the welcome screen offers two demo customers. Hamza M. has past
pickups and monthly savings; Sara L. is a first-time customer, so first-visit
deals apply. Both are created by `pnpm --filter api run seed`.

Restaurant app: the sign-in screen lists every restaurant with its demo key
(for example `MISO-0001` for Miso & Ember Kitchen) and can fill it in for you.
The keys live in `packages/shared/src/seed/restaurants.ts`.

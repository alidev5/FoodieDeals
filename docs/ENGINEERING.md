# FoodieDeals

A deals-first food **pickup** app. No delivery, no delivery or service fees.
Customers find restaurant deals nearby, order, pay in the app, and collect at the
counter by saying their name. Restaurants see paid orders live and move them
through statuses. Every status change reaches the customer's phone in under 2
seconds without a refresh.

## Domain rules

- One order = one restaurant. The cart holds items from one restaurant only;
  adding an item from a different restaurant opens a sheet "Start a new order?"
  with actions Start new order / Keep current cart.
- Money is integer cents everywhere in code. Format to currency strings only in
  the UI layer.
- NY sales tax is 8.875% on the subtotal **after** the deal discount, rounded
  half-up. `total = subtotal - discount + tax`. There are no fees charged to the
  customer beyond tax.
- Platform fee: 5% of the total, rounded half-up, charged through Stripe Connect
  `application_fee_amount`. The remainder goes to the restaurant's connected
  account (destination charge).
- Deals have types `BOGO`, `PERCENT_OFF`, `FREE_ITEM`, `FIXED_PRICE_BUNDLE`, each
  with conditions: minimum subtotal, time window, first-visit only, eligible
  items. Exactly one deal applies per order — whichever yields the largest
  discount. An ineligible deal must surface a reason string the UI can render
  directly, e.g. "Add $7.00 more to unlock".
- Order statuses: `WAITING` (paid) -> `ACCEPTED` -> `READY` -> `PICKED_UP`.
  Restaurant actions map 1:1 to transitions: Accept, Mark ready, Picked up. Any
  other transition is rejected. The customer tracker shows four steps — Waiting,
  Accepted, Preparing, Ready — where `ACCEPTED` renders "Accepted" as done and
  "Preparing" as in progress.
- Orders are created **only** from the Stripe webhook `payment_intent.succeeded`,
  idempotent by Stripe event id. The client never creates an order directly.
- Restaurant Open/Paused: while paused, new payment intents for that restaurant
  are rejected, Home shows it as Paused, and no new orders reach the tablet.
- Order numbers are sequential per restaurant per day (see `DailyOrderCounter`).
- Customer identity: a pickup name entered once (e.g. "Hamza M.") plus a device id
  persisted on the phone. Restaurant identity: pick a restaurant and enter its
  demo key on first launch.
- Worked example that must hold everywhere code touches pricing: Miso Ramen
  $16.00 + Crispy Pork Gyoza $12.00, deal "20% off orders over $25" → discount
  $5.60, tax $1.99, total $24.39, platform fee $1.22, restaurant receives $23.17.

## Architecture

pnpm workspaces + Turborepo monorepo:

- `apps/customer` — Expo (latest SDK), Expo Router, TypeScript. Phone app. Must
  run in Expo Go.
- `apps/restaurant` — Expo, Expo Router, TypeScript. Tablet, landscape, runs in
  Expo Go and in a browser (`expo start --web`).
- `apps/api` — NestJS, Socket.IO, Prisma, PostgreSQL (docker-compose locally,
  Railway in production).
- `packages/shared` — pure TypeScript domain core: money, catalog types, Zod
  schemas, pricing, deal strategies, the order state machine, socket event
  contracts, theme. No framework imports. Built with tsup, tested with Vitest.
- `packages/ui-native` — React Native primitives and providers shared by both
  apps (Text, Button, Badge, Card, Sheet, Toggle, API client, socket provider).
  No duplicated code between the two apps.

Only libraries supported in Expo Go. Payments use `@stripe/stripe-react-native`'s
PaymentSheet.

Nest modules: `config`, `prisma`, `restaurants`, `customers`, `checkout`,
`payments` (webhooks), `orders`, `realtime`, `health`. Domain events flow through
`@nestjs/event-emitter`; the `realtime` module subscribes to them, so `orders`
never imports the gateway directly.

Feature-based folders in both Expo apps:
`src/features/<feature>/{api,hooks,components,screens}`, with routes living only
in `src/app`.

Depend on interfaces at boundaries: a `CatalogRepository` in the apps (local
sample data in Phase 1, HTTP in Phase 2+), a `StripeClient` provider in the API so
tests never call Stripe directly.

## Design

Palette: cream `#F7F3EE` background, white `#FFFFFF` cards, near-black `#1B1613`
for text/dark cards/primary buttons, line `#ECE5DD`, secondary text `#5E5550` and
`#9A908A`. One accent only: ember `#E5482B` for discount amounts, the primary
action, and the current status step. Green `#1F8A5B` only for small "Open" and
"Ready" dots.

Rules that override the original Figma frames (which use an older, busier
treatment — build the calmer version described here):

- No gradients or glows. The savings card (Home) and the pickup name card
  (Pickup) are solid near-black. Keep only dark scrims over food photos for
  legibility.
- No yellow anywhere. Deal badges on photos, the order chip, the "+18%" pill,
  "View order", count badges, the logo tile: white with near-black text, 1px
  `#ECE5DD` border on light backgrounds. Stars/sparkline/icons: near-black on
  light, white on dark.
- "Best value" deal card and the selected checkout deal: white with a 1.5px
  near-black border.
- Savings banners ("You're saving $5.60", payout split on the tablet): cream
  background, near-black text.
- No colored shadows — one soft neutral shadow token only.
- Checkout has no "Delivery fee" row; one row "Fees $0.00 · pickup" instead.
- Tablet order-detail panel uses 12px spacing so it never touches the bottom
  edge.

Radii: 12, 16, 20, 24, 28, pill. Spacing: 4, 8, 12, 16, 20, 24, 32. Fonts:
Bricolage Grotesque (headings), Plus Jakarta Sans (UI), via
`@expo-google-fonts`. Never hard-code colors or sizes in components — read from
the theme generated out of `design/tokens.json`.

Figma source of truth: file `3dPUi3jcqvvIMNiyt8u4xM`, page "FoodieDeals —
Screens" (read-only, never edit). See `design/figma-notes.md` for current status
— the Figma MCP connection was rate-limited during the initial build, so screens
and photo assets may still be pending manual export.

## Code standards

This code must read like a careful senior engineer wrote it by hand:

- No comments that restate the code, no section-banner comments, no
  step-by-step narration, no emojis, no commented-out code, no TODOs, no
  placeholder text, no "generated by" or tool attribution anywhere (code, docs,
  package.json, commit messages).
- Comments only where a decision is not obvious from the code, written briefly
  and plainly.
- Docs in a plain, factual tone — no marketing language, no exclamation marks,
  no emoji.
- Consistent naming, small files, one responsibility per module, no dead code
  or unused dependencies.
- Business logic lives in `packages/shared` and Nest services. Controllers,
  gateways, and React components only translate input and output.
- Efficiency: FlashList for long lists, `expo-image` with caching for photos,
  memoized list items, Zustand selectors to avoid re-renders, TanStack Query
  with stable query keys, quotes debounced on cart change. Prisma: select only
  needed fields, include relations in one query (no N+1), index every lookup
  used, transactions where writes must be atomic. Socket emits go to the
  smallest room that needs them, only after the database transaction commits.
- Quality: TypeScript strict, no `any`, Zod validation for env/requests/socket
  payloads, a global exception filter with a consistent error body, Nest
  `Logger` instead of `console`. ESLint + Prettier, Husky + lint-staged,
  commitlint (conventional commits), GitHub Actions CI running lint, typecheck,
  and test with a Postgres service.

## Working in this repo

- Run `pnpm install` at the root once per clone (pulls in all workspace
  packages).
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all
  fan out through Turborepo to every workspace.
- `docker-compose up -d` starts local Postgres for `apps/api`.

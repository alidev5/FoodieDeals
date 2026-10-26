# FoodieDeals

It has two apps that share one backend:

- **Customer app**: browse deals, order, pay by card and follow the order.
- **Restaurant dashboard**: incoming orders, accept → ready → picked up, deals, menu and payouts.

## Try it online (nothing to install)

| What                                     | Link                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer app                             | https://foodiedeals-customer.expo.app                                                                                                                                       |
| Restaurant dashboard                     | https://foodiedeals-restaurant.expo.app                                                                                                                                     |
| Android APKs (latest build on each page) | [Customer](https://expo.dev/accounts/alidev5/projects/foodiedeals-customer/builds) · [Restaurant](https://expo.dev/accounts/alidev5/projects/foodiedeals-restaurant/builds) |

## Run it on your computer

Pick one option. **Option A** Runs everything on your machine,
including the database and API, with one command.

### Option A: Docker, fully local (recommended)

**1. Install these first**

- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/). Open it once and wait until it says it's running.

**2. Download the project**

```bash
git clone https://github.com/alidev5/FoodieDeals.git
cd FoodieDeals
```

**3. Add Stripe test keys (only needed for paying at checkout)**

Create a file named `.env` in the main `FoodieDeals` folder, the same folder as
`docker-compose.yml`. Put these two lines in it:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Replace the `...` with your own keys from the
[Stripe dashboard](https://dashboard.stripe.com/test/apikeys) → Developers → API keys, with
**Test mode** on. Both keys must come from the **same** Stripe account.

Skip this step if you only want to browse. Everything else works without it, and checkout
will say that payments aren't set up.

**4. Start everything**

```bash
docker compose up --build
```

The first run downloads and builds everything, which takes about 5–10 minutes. When it's
ready, open:

|                      |                                  |
| -------------------- | -------------------------------- |
| Customer app         | http://localhost:8081            |
| Restaurant dashboard | http://localhost:8082            |
| API (for reference)  | http://localhost:3000/api/health |

This starts three containers: a PostgreSQL database, the API, and a web server for both apps.
The database is created and filled with demo restaurants, menus and deals on the first start.

**Stop / restart / reset**

```bash
docker compose down            # stop (data is kept)
docker compose up              # start again (fast; add --build after changing code or .env)
docker compose down -v         # stop and delete the database (fresh demo data next start)
```

### Option B: Node.js, using the hosted backend

Use this if you don't want Docker. The apps run on your machine but use the online backend
(the same one as the links above), so payments already work.

Install [Git](https://git-scm.com/downloads) and [Node.js 20 or newer](https://nodejs.org), then:

```bash
git clone https://github.com/alidev5/FoodieDeals.git
cd FoodieDeals
npm start
```

Open http://localhost:8081 (customer) and http://localhost:8082 (restaurant). The first start
takes a few minutes. Stop with `Ctrl+C`.

## Using the demo

1. Open the **restaurant dashboard** and sign in to a restaurant with its key:
   `MISO-0001`, `LOTUS-0002`, `NAPOLI-0003`, `CEDAR-0004` or `TARO-0005` (Taro Cloud is paused).
2. In another window, open the **customer app**, enter a name and order from that restaurant.
3. Pay with the Stripe test card **4242 4242 4242 4242**, any future expiry date and any CVC.
4. The order appears on the dashboard with a chime. Accept it and mark it ready, and the
   customer's screen follows along.

## Settings: what to set and where

| Setting                                                                                             | File                                         | Needed for                                                                          |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                                                                                 | `.env` in the main `FoodieDeals` folder      | Docker (Option A): payments                                                         |
| `STRIPE_PUBLISHABLE_KEY`                                                                            | `.env` in the main `FoodieDeals` folder      | Docker (Option A): payments; must be from the same Stripe account as the secret key |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_FUNCTION_REGION` | `apps/customer/.env`, `apps/restaurant/.env` | Option B: which hosted backend to use. Already filled in.                           |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`                                                                | `apps/customer/.env`                         | Option B: card form. Already filled in.                                             |
| `EXPO_PUBLIC_API_URL`                                                                               | `apps/customer/.env`, `apps/restaurant/.env` | Optional: use an API at another address instead of Supabase                         |

The app `.env` files are created automatically from their `.env.example` files. Values that
start with `EXPO_PUBLIC_` are visible in the browser by design. **Never put a secret key
(`sk_…`) in an app `.env` file, and never commit any `.env` file.**

## Troubleshooting

- **"Port is already allocated" / "address already in use"**: another program is using port
  8081, 8082, 3000 or 5433. Close it, or change the left-hand number of that port in
  `docker-compose.yml` (e.g. `"9081:8081"`) and open the new address.
- **Checkout says payments aren't set up**: add both Stripe keys to `.env` (step 3), then run
  `docker compose up --build`.
- **Payment fails right after adding keys**: the secret and publishable keys must come from
  the same Stripe account and both be test-mode keys.
- **Changes to `.env` don't show up**: run `docker compose up --build` so the apps are rebuilt.

## Project layout

- `apps/customer`: Expo customer app (Android, iOS, web)
- `apps/restaurant`: Expo restaurant dashboard (tablet and web)
- `apps/api`: the API (Hono). It runs in Docker locally and as a Supabase Edge Function when hosted.
- `packages/shared`: domain logic (pricing, deals, order states, realtime events)
- `packages/ui-native`: shared UI components, theme and realtime provider
- `supabase/`: database migrations, seed data and the bundled edge function
- `Dockerfile`, `docker-compose.yml`, `docker/`: the fully local setup

## Deploying (hosted version)

Backend on a new Supabase project:

```bash
npx pnpm@10.18.1 install
npx pnpm@10.18.1 --filter @foodiedeals/api bundle   # builds supabase/functions/api/index.js
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --include-seed                  # tables + demo data (first time only)
npx supabase functions deploy api --no-verify-jwt
```

Then add `STRIPE_SECRET_KEY` under that project's Edge Functions → Secrets. Put the project's
URL, publishable key and database region into the app `.env` files and into the `preview`
profile in each app's `eas.json`.

Web apps (Expo Hosting), from `apps/customer` or `apps/restaurant`:

```bash
npx expo export -p web && npx eas-cli deploy --prod
```

Android APK (Expo EAS), from either app folder:

```bash
npx eas-cli build -p android --profile preview
```

iOS builds need a paid Apple Developer account.

## Development

```bash
npx pnpm@10.18.1 install
npx pnpm@10.18.1 lint && npx pnpm@10.18.1 typecheck && npx pnpm@10.18.1 test
```

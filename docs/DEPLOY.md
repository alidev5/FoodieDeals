# Deploying

Three independent deploys: the API to Railway, the customer app as an
Android preview build through EAS, and the restaurant app's web export
through EAS Hosting. All three need manual steps that only you can do (an
account login, or a value only you hold) — those are called out explicitly
below and repeated in the final build report.

## API → Railway

The repo root has `railway.json`, which points Railway at
`apps/api/Dockerfile` and runs migrations + the seed on every deploy before
starting the server.

1. **[Manual]** Create a Railway account/project and link this repo (or run
   `railway init` from the repo root with the Railway CLI).
2. **[Manual]** Add a PostgreSQL plugin to the Railway project — this gives
   you a `DATABASE_URL` reference variable.
3. In the Railway service's variables, set:
   - `DATABASE_URL` → reference the Postgres plugin's `DATABASE_URL`
   - `PORT` → Railway sets this automatically; no action needed
   - `STRIPE_SECRET_KEY` → **[Manual]** your Stripe secret key (test or live)
   - `STRIPE_WEBHOOK_SECRET` → **[Manual]** see the webhook step below —
     you won't have this value until after the first deploy
4. Deploy. Railway builds `apps/api/Dockerfile` with the repo root as build
   context (needed because the Dockerfile copies `packages/shared` alongside
   `apps/api`), then runs `prisma migrate deploy`, the seed, and starts the
   server. `/health` is the configured health check path.
5. **[Manual]** Once deployed, note the public URL Railway gives the service
   (e.g. `https://foodiedeals-api-production.up.railway.app`). You'll need
   it for the next two sections and for the Stripe webhook.
6. **[Manual]** Run the connected-account setup once against the deployed
   database — either run `pnpm --filter api run stripe:setup` locally with
   `DATABASE_URL` and `STRIPE_SECRET_KEY` pointed at the production values,
   or redeploy with that script wired into a one-off Railway job.

### Stripe webhook endpoint — manual

Stripe has to be told where to send `payment_intent.succeeded` and
`payment_intent.payment_failed` events for the deployed API, which only you
can configure:

1. In the Stripe Dashboard (test mode), go to Developers → Webhooks → Add
   endpoint.
2. Endpoint URL: `https://<your-railway-url>/payments/webhook`.
3. Events to send: `payment_intent.succeeded`,
   `payment_intent.payment_failed`.
4. Copy the signing secret (`whsec_...`) it gives you and set it as
   `STRIPE_WEBHOOK_SECRET` in the Railway service's variables, then redeploy
   (or restart) the service so it picks up the new value.

## Customer app → EAS (Android preview APK)

`apps/customer/eas.json` has a `preview` profile that builds an internal
distribution APK.

1. **[Manual]** `npx eas login` (needs an Expo account).
2. **[Manual]** Edit `apps/customer/eas.json`'s `build.preview.env` and set
   `EXPO_PUBLIC_API_URL` to your Railway URL and
   `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your Stripe test publishable key
   — both are placeholders right now.
3. From `apps/customer`: `npx eas build --platform android --profile preview`.
4. **[Manual]** EAS will prompt to generate or supply Android signing
   credentials on first build — accept the generated ones for a preview
   build.
5. Once the build finishes, EAS gives you an install link / QR code for the
   APK.

## Restaurant app → EAS Hosting (web)

The restaurant app already runs in a browser locally (`expo start --web`);
EAS Hosting serves the same static export publicly.

1. From `apps/restaurant`: `npx expo export --platform web`, which writes
   `apps/restaurant/dist`.
2. **[Manual]** `npx eas login` if not already signed in.
3. `npx eas deploy` from `apps/restaurant` (first run will ask you to confirm
   a project; accept). This uploads `dist` to EAS Hosting and gives you a
   public URL.
4. Set `EXPO_PUBLIC_API_URL` to your Railway URL before the export step (an
   `.env` file or shell export is read at build time, same as local dev) so
   the hosted tablet app talks to the deployed API instead of localhost.

## What's left after all three are deployed

- Restaurants need their real Stripe Connect accounts (the `stripe:setup`
  script's accounts are test-mode-only magic-value accounts — see
  `docs/PAYMENTS.md`) before this could take real payments.
- No CDN/caching layer in front of the API; fine for a demo, worth adding
  before meaningful traffic.
- No logging/monitoring integration beyond Railway's own logs and the Nest
  `Logger` calls already in place.

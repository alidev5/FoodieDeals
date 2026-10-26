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

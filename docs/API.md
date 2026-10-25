# API reference

Interactive Swagger docs are served at `/docs` when the API is running
locally (`http://localhost:3000/docs`). This page is the quick-reference
version.

Base URL: `EXPO_PUBLIC_API_URL` in the Expo apps, `http://localhost:3000` by
default locally.

## Restaurants

### `GET /restaurants?dealType=`

Lists restaurants. `dealType` is optional: `BOGO`, `PERCENT_OFF`,
`FREE_ITEM`, or `FIXED_PRICE_BUNDLE`.

### `GET /restaurants/:id`

A single restaurant with its menu and deals, or `404`.

## Customers

### `POST /customers`

```json
{ "deviceId": "string", "pickupName": "string" }
```

Upserts a customer by `deviceId`. Returns the customer row.

## Checkout

### `POST /checkout/quote`

```json
{
  "restaurantId": "string",
  "deviceId": "string",
  "items": [{ "menuItemId": "string", "quantity": 1 }]
}
```

Recomputes pricing server-side (subtotal, discount, tax, total, platform fee,
restaurant payout) using the exact same `computeQuote` function the apps use
for a live preview. `400` if an item doesn't belong to the restaurant.

### `POST /checkout/payment-intent`

Same body as `quote`, plus `pickupName`. Creates a Stripe PaymentIntent with
the computed total as `amount` and the platform fee as
`application_fee_amount`, destined to the restaurant's connected account.
Returns `{ clientSecret, paymentIntentId, quote }`.

- `409` if the restaurant is paused, or has no connected Stripe account yet.
- `400` for a mixed cart (an item from a different restaurant).

## Payments

### `POST /payments/webhook`

Stripe webhook endpoint. Verifies the `stripe-signature` header against the
raw request body. Handles `payment_intent.succeeded` (creates the order,
idempotent by Stripe event id) and `payment_intent.payment_failed` (marks the
checkout session failed). Not meant to be called directly — see
[PAYMENTS.md](./PAYMENTS.md).

## Orders

### `GET /orders/:id?deviceId=`

Returns the order if `deviceId` matches the order's customer, `403`
otherwise, `404` if the order doesn't exist.

### `GET /orders/by-payment-intent/:paymentIntentId`

Resolves an order by Stripe PaymentIntent id. `404` until the webhook has
created the order — the customer app polls this with backoff right after
`presentPaymentSheet()` resolves.

### `PATCH /orders/:id/actions`

Header: `x-restaurant-key: <restaurant demo key>`.

```json
{ "action": "ACCEPT" | "MARK_READY" | "PICKED_UP" }
```

Advances the order by exactly one step (`WAITING -> ACCEPTED -> READY ->
PICKED_UP`). `401` for a wrong/missing key, `409` for an invalid transition
(e.g. accepting an already-accepted order).

### `GET /restaurants/:restaurantId/orders?status=`

Header: `x-restaurant-key`. Lists that restaurant's orders, optionally
filtered by status, newest first.

### `GET /restaurants/:restaurantId/stats`

Header: `x-restaurant-key`. Returns
`{ active, ready, completedToday, revenueTodayCents }`.

### `PATCH /restaurants/:restaurantId/availability`

Header: `x-restaurant-key`.

```json
{ "isOpen": true }
```

Opens or pauses the restaurant; broadcasts `restaurant:availability-changed`
to every connected customer.

## Health

### `GET /health`

`{ "status": "ok" }` once a trivial query against Postgres succeeds.

## Error shape

Every error response (from the global exception filter) has the same shape:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Restaurant abc123 not found",
  "path": "/restaurants/abc123",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

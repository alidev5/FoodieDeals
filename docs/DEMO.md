# 3-minute client demo

Run `pnpm dev` first (API + both Expo apps), with `apps/api/.env` pointing at
a Stripe test account that's been through `stripe:setup`, and `stripe listen
--forward-to localhost:3000/payments/webhook` running in a separate terminal.
Have the customer app open on a phone (Expo Go) and the restaurant app open
in a browser (`w` in the restaurant app's Expo CLI), side by side.

## 0:00 — The pitch (15s)

"FoodieDeals is deals-first pickup — no delivery, no delivery fees. Customers
find a deal, pay in the app, and walk in and say their name. Restaurants see
the paid order the instant it lands, with zero manual order entry."

## 0:15 — Browse and the deal engine (30s)

- Open the customer app's Home screen. Point out the filter chips (Open now,
  BOGO, % off, Free item, Bundle) and the search bar.
- Tap **Miso & Ember Kitchen**. Scroll the deal list — three different deal
  types (percent off, free item, BOGO) each show their own eligibility
  reason, computed live, not hand-written per screen.
- Add Miso Ramen and Crispy Pork Gyoza. The "20% off orders over $25" deal
  applies automatically because it's the one that saves the most.
- Try adding an item from a different restaurant — the "Start a new order?"
  sheet appears, enforcing one order per restaurant.

## 0:45 — Checkout and payment (45s)

- Go to Checkout. Walk through the price breakdown: subtotal $28.00, deal
  −$5.60, tax (NY 8.875%) $1.99, total $24.39 — call out that this is
  recomputed server-side at payment time, the client number is only a
  preview.
- Tap Pay. Use Stripe's test card `4242 4242 4242 4242`, any future expiry,
  any CVC.
- While the PaymentSheet is processing, mention destination charges: the
  restaurant gets $23.17, the platform keeps 5% ($1.22), split automatically
  by Stripe Connect.

## 1:30 — Live order tracking (30s)

- The screen shows "Confirming payment" for a moment — that's the app
  polling for the webhook-created order, not a fake delay.
- Land on the Pickup screen: pickup name, order number, the four-step
  tracker, Directions/Call for the restaurant.
- Switch to the restaurant app. The order appeared instantly with a
  highlight and a chime, with no refresh.

## 2:00 — The restaurant side (45s)

- On the restaurant tablet: stat cards (Active, Ready, Completed today,
  Revenue today), Active/Ready/Done tabs, order detail panel with items, the
  applied deal, the full price breakdown, and the payout split.
- Tap **Accept**. Switch back to the customer phone — the tracker updates to
  "Preparing" within about a second, with no refresh.
- Tap **Mark ready**, then **Picked up** on the tablet, pointing out the
  tracker updates live each time and the action button is always exactly the
  next correct step — the backend rejects anything else with a 409.
- Toggle the restaurant Paused. Switch to the customer Home screen — the
  restaurant shows Paused immediately, live, without refreshing.

## 2:45 — Close (15s)

"Every number end to end — discount, tax, platform fee, payout — comes from
one pricing function shared by the phone, the tablet, and the server, so
there's no drift between what the customer is quoted and what actually gets
charged."

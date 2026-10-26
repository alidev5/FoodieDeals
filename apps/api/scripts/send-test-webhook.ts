import { addLine, computeQuote, createEmptyCart, SEED_RESTAURANTS } from "@foodiedeals/shared";
import Stripe from "stripe";

import { encodePaymentIntentMetadata } from "../src/paymentIntentMetadata";

const apiUrl = process.env.API_URL ?? "http://localhost:3000/api";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET must be set to sign the test event");
}

function buildEvent() {
  const misoEmber = SEED_RESTAURANTS.find((restaurant) => restaurant.id === "miso-ember");
  if (!misoEmber) throw new Error("fixture restaurant missing");

  const ramen = misoEmber.menu.find((item) => item.id === "miso-ramen");
  const gyoza = misoEmber.menu.find((item) => item.id === "crispy-pork-gyoza");
  if (!ramen || !gyoza) throw new Error("fixture menu items missing");

  let cart = createEmptyCart();
  cart = addLine(cart, ramen);
  cart = addLine(cart, gyoza);

  const quote = computeQuote(cart, misoEmber.deals, new Date(), false);
  const paymentIntentId = `pi_test_${Date.now()}`;

  const metadata = encodePaymentIntentMetadata({
    restaurantId: misoEmber.id,
    deviceId: "dev-script-device",
    pickupName: "Dev Script",
    items: cart.lines.map((line) => ({
      menuItemId: line.menuItem.id,
      name: line.menuItem.name,
      priceCents: line.menuItem.priceCents,
      quantity: line.quantity,
    })),
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
    platformFeeCents: quote.platformFeeCents,
    restaurantReceivesCents: quote.restaurantReceivesCents,
    appliedDealId: quote.appliedDeal?.dealId ?? "",
    appliedDealName: quote.appliedDeal?.dealName ?? "",
  });

  return {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: paymentIntentId,
        object: "payment_intent",
        amount: quote.totalCents,
        currency: "usd",
        metadata,
      },
    },
  };
}

async function main() {
  const payload = JSON.stringify(buildEvent());
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret! });

  const response = await fetch(`${apiUrl}/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": signature },
    body: payload,
  });

  console.log(`Webhook responded ${response.status}`);
  console.log(await response.text());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

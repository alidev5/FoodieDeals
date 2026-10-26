import { describe, expect, it } from "vitest";

import { encodePaymentIntentMetadata, paymentIntentMetadataSchema } from "./paymentIntentMetadata";

describe("payment intent metadata", () => {
  it("round-trips through Stripe's string-only metadata", () => {
    const original = {
      restaurantId: "miso-ember",
      deviceId: "device-1",
      pickupName: "Hamza M.",
      items: [{ menuItemId: "miso-ramen", name: "Miso Ramen", priceCents: 1600, quantity: 2 }],
      subtotalCents: 3200,
      discountCents: 640,
      taxCents: 227,
      totalCents: 2787,
      platformFeeCents: 139,
      restaurantReceivesCents: 2648,
      appliedDealId: "deal-1",
      appliedDealName: "20% off",
    };

    const encoded = encodePaymentIntentMetadata(original);
    expect(Object.values(encoded).every((value) => typeof value === "string")).toBe(true);
    expect(paymentIntentMetadataSchema.parse(encoded)).toEqual(original);
  });
});

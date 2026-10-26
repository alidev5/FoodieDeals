import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useState, type ReactNode } from "react";

import { STRIPE_PUBLISHABLE_KEY } from "./stripeKey";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  stripePromise ??= STRIPE_PUBLISHABLE_KEY
    ? loadStripe(STRIPE_PUBLISHABLE_KEY)
    : Promise.resolve(null);
  return stripePromise;
}

const FONTS = [
  {
    cssSrc: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&display=swap",
  },
];

// Mirrors the native StripeProvider's props so the root layout is platform-agnostic.
export function StripeProvider({
  children,
}: {
  publishableKey: string;
  merchantIdentifier?: string;
  children: ReactNode;
}) {
  const [stripe] = useState(getStripe);
  return (
    <Elements stripe={stripe} options={{ fonts: FONTS }}>
      {children}
    </Elements>
  );
}

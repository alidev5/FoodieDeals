import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";

import { pollWithBackoff } from "../../../lib/pollWithBackoff";
import { syncPaymentIntent } from "../../orders/api/ordersApi";
import { createPaymentIntent } from "../api/checkoutApi";

import { describePaymentError, PAID_BUT_UNCONFIRMED } from "./paymentErrors";

/**
 * processing: creating the intent on our API. authorizing: the card is with Stripe.
 * confirming: paid, waiting for the order to exist so the kitchen can see it.
 */
export type PaymentStatus = "idle" | "processing" | "authorizing" | "confirming" | "error";

export interface PayArgs {
  restaurantId: string;
  deviceId: string;
  pickupName: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export function usePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = async (args: PayArgs): Promise<string | null> => {
    setStatus("processing");
    setError(null);

    try {
      const intent = await createPaymentIntent(args);

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: intent.clientSecret,
        merchantDisplayName: "FoodieDeals",
        defaultBillingDetails: { name: args.pickupName },
      });
      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      setStatus("authorizing");
      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code === "Canceled") {
          setStatus("idle");
          return null;
        }
        throw new Error(presentResult.error.message);
      }

      setStatus("confirming");
      const order = await pollWithBackoff(() => syncPaymentIntent(intent.paymentIntentId)).catch(
        () => {
          throw new Error(PAID_BUT_UNCONFIRMED);
        },
      );
      setStatus("idle");
      return order.id;
    } catch (caught) {
      setStatus("error");
      setError(describePaymentError(caught));
      return null;
    }
  };

  return { pay, status, error, isReady: true };
}

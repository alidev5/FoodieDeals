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
  const { confirmPayment } = useStripe();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = async (args: PayArgs): Promise<string | null> => {
    setStatus("processing");
    setError(null);

    try {
      const intent = await createPaymentIntent(args);

      setStatus("authorizing");
      const result = await confirmPayment(intent.clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: { billingDetails: { name: args.pickupName } },
      });
      if (result.error) {
        if (result.error.code === "Canceled") {
          setStatus("idle");
          return null;
        }
        throw new Error(result.error.message);
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

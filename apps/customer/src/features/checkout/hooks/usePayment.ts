import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";

import { pollWithBackoff } from "../../../lib/pollWithBackoff";
import { getOrderByPaymentIntent } from "../../orders/api/ordersApi";
import { createPaymentIntent } from "../api/checkoutApi";

export type PaymentStatus = "idle" | "processing" | "confirming" | "error";

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
      });
      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code === "Canceled") {
          setStatus("idle");
          return null;
        }
        throw new Error(presentResult.error.message);
      }

      setStatus("confirming");
      const order = await pollWithBackoff(() => getOrderByPaymentIntent(intent.paymentIntentId));
      setStatus("idle");
      return order.id;
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Payment failed");
      return null;
    }
  };

  return { pay, status, error };
}

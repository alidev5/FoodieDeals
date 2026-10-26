import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

import { pollWithBackoff } from "../../../lib/pollWithBackoff";
import { syncPaymentIntent } from "../../orders/api/ordersApi";
import { createPaymentIntent } from "../api/checkoutApi";

import { describePaymentError, PAID_BUT_UNCONFIRMED } from "./paymentErrors";
import type { PayArgs, PaymentStatus } from "./usePayment";

export function usePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = async (args: PayArgs): Promise<string | null> => {
    const card = elements?.getElement(CardNumberElement);
    if (!stripe || !card) {
      setStatus("error");
      setError("Payments are still loading. Give it a second and try again.");
      return null;
    }

    setStatus("processing");
    setError(null);

    try {
      const intent = await createPaymentIntent(args);

      setStatus("authorizing");
      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card, billing_details: { name: args.pickupName } },
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Your card was not charged.");
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

  return { pay, status, error, isReady: Boolean(stripe && elements) };
}

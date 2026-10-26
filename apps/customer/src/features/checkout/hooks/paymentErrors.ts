import { ApiError } from "@foodiedeals/ui-native";

/** Turns API and Stripe failures into a sentence the checkout can show as-is. */
export function describePaymentError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return "Something went wrong on our side. Please try again.";
    try {
      const body = JSON.parse(error.message) as { message?: string | string[] };
      const message = Array.isArray(body.message) ? body.message[0] : body.message;
      if (message) return message;
    } catch {
      // Non-JSON bodies fall through to the generic messages below.
    }
    return "We couldn't start this payment. Please try again.";
  }
  if (error instanceof TypeError) {
    return "Can't reach FoodieDeals right now. Check your connection and try again.";
  }
  return error instanceof Error ? error.message : "Payment failed. Please try again.";
}

export const PAID_BUT_UNCONFIRMED =
  "Your payment went through, but the order is taking a moment to reach the kitchen. It will appear under Orders shortly.";

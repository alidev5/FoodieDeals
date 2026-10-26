import { useTheme } from "@foodiedeals/ui-native";
import { CardForm } from "@stripe/stripe-react-native";
import { Platform } from "react-native";

export interface PaymentCardFormProps {
  onCompleteChange: (complete: boolean) => void;
  disabled?: boolean;
}

// CardForm always turns the postal code on, but its native view accepts the prop. Pickup orders
// don't need a billing postcode, so it's switched off (a spread prop wins over CardForm's own).
const WITHOUT_POSTAL_CODE = { postalCodeEnabled: false };

// The native form has a fixed height: card number, expiry + CVC, then country.
const FORM_HEIGHT = Platform.select({ ios: 240, default: 270 });

/**
 * Stripe's native card form: card number on its own row, expiry and CVC below, with Stripe's
 * own inline validation. Card data goes straight to Stripe and never touches our API.
 */
export function PaymentCardForm({ onCompleteChange, disabled = false }: PaymentCardFormProps) {
  const theme = useTheme();

  return (
    <CardForm
      {...WITHOUT_POSTAL_CODE}
      disabled={disabled}
      placeholders={{ number: "1234 1234 1234 1234", expiration: "MM/YY", cvc: "CVC" }}
      cardStyle={{
        backgroundColor: theme.color.surface,
        borderColor: theme.color.line,
        borderWidth: 1.5,
        borderRadius: theme.radius.md,
        textColor: theme.color.text,
        placeholderColor: theme.color.textTertiary,
        cursorColor: theme.color.accent,
        textErrorColor: theme.color.accent,
        fontSize: 16,
      }}
      style={{ width: "100%", height: FORM_HEIGHT }}
      onFormComplete={(card) => onCompleteChange(card.complete)}
    />
  );
}

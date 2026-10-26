import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js";
import type { StripeElementChangeEvent, StripeElementStyle } from "@stripe/stripe-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";

import type { PaymentCardFormProps } from "./PaymentCardForm";

type FieldName = "number" | "expiry" | "cvc";

interface FieldState {
  complete: boolean;
  error: string | null;
}

const EMPTY_FIELD: FieldState = { complete: false, error: null };

function Field({
  label,
  focused,
  error,
  children,
}: {
  label: string;
  focused: boolean;
  error: string | null;
  children: ReactNode;
}) {
  const theme = useTheme();
  const borderColor = error
    ? theme.color.accent
    : focused
      ? theme.color.surfaceDark
      : theme.color.line;

  return (
    <View style={{ flex: 1, gap: theme.spacing.xs }}>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <View
        style={{
          backgroundColor: focused ? theme.color.surface : theme.color.surfaceMuted,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md + 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Stripe Elements card fields; card data goes straight to Stripe and never touches our API. */
export function PaymentCardForm({ onCompleteChange, disabled = false }: PaymentCardFormProps) {
  const theme = useTheme();
  const [fields, setFields] = useState<Record<FieldName, FieldState>>({
    number: EMPTY_FIELD,
    expiry: EMPTY_FIELD,
    cvc: EMPTY_FIELD,
  });
  const [focused, setFocused] = useState<FieldName | null>(null);

  const isComplete = fields.number.complete && fields.expiry.complete && fields.cvc.complete;
  useEffect(() => {
    onCompleteChange(isComplete);
  }, [isComplete, onCompleteChange]);

  const style = useMemo<StripeElementStyle>(
    () => ({
      base: {
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        fontSize: "16px",
        fontWeight: "600",
        color: theme.color.text,
        iconColor: theme.color.text,
        "::placeholder": { color: theme.color.textTertiary, fontWeight: "500" },
      },
      invalid: { color: theme.color.accent, iconColor: theme.color.accent },
    }),
    [theme],
  );

  const handlers = (name: FieldName) => ({
    onChange: (event: StripeElementChangeEvent) =>
      setFields((current) => ({
        ...current,
        [name]: { complete: event.complete, error: event.error?.message ?? null },
      })),
    onFocus: () => setFocused(name),
    onBlur: () => setFocused((current) => (current === name ? null : current)),
  });

  const firstError = fields.number.error ?? fields.expiry.error ?? fields.cvc.error;

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Field label="Card number" focused={focused === "number"} error={fields.number.error}>
        <CardNumberElement
          options={{
            style,
            showIcon: true,
            disabled,
            disableLink: true,
            placeholder: "1234 1234 1234 1234",
          }}
          {...handlers("number")}
        />
      </Field>
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Field label="Expiry" focused={focused === "expiry"} error={fields.expiry.error}>
          <CardExpiryElement options={{ style, disabled }} {...handlers("expiry")} />
        </Field>
        <Field label="CVC" focused={focused === "cvc"} error={fields.cvc.error}>
          <CardCvcElement options={{ style, disabled, placeholder: "123" }} {...handlers("cvc")} />
        </Field>
      </View>
      {firstError ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
          <Icon name="alert-circle" size={14} color={theme.color.accent} />
          <Text variant="caption" color="accent">
            {firstError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

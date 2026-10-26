import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { useEffect } from "react";
import { View } from "react-native";

export interface PaymentCardFormProps {
  onCompleteChange: (complete: boolean) => void;
  disabled?: boolean;
}

/** On native the card is entered in Stripe's PaymentSheet, so there is nothing to collect here. */
export function PaymentCardForm({ onCompleteChange }: PaymentCardFormProps) {
  const theme = useTheme();

  useEffect(() => {
    onCompleteChange(true);
  }, [onCompleteChange]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        backgroundColor: theme.color.surfaceMuted,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="credit-card" size={18} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">Card, Apple Pay or Google Pay</Text>
        <Text variant="caption" color="tertiary">
          You enter your card in Stripe&apos;s secure sheet after tapping Pay.
        </Text>
      </View>
    </View>
  );
}

import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { ActivityIndicator, View } from "react-native";

import type { PaymentStatus } from "../hooks/usePayment";

const STEPS: Array<{ status: PaymentStatus; title: string; detail: string }> = [
  { status: "processing", title: "Locking in your price", detail: "Re-checking deals and tax" },
  { status: "authorizing", title: "Authorizing your card", detail: "Securely with Stripe" },
  { status: "confirming", title: "Sending to the kitchen", detail: "Creating your pickup order" },
];

export interface PaymentProgressOverlayProps {
  status: PaymentStatus;
  totalLabel: string;
}

/** Blocks the checkout while a payment is in flight and shows which stage it is in. */
export function PaymentProgressOverlay({ status, totalLabel }: PaymentProgressOverlayProps) {
  const theme = useTheme();
  const activeIndex = STEPS.findIndex((step) => step.status === status);
  if (activeIndex === -1) {
    return null;
  }

  return (
    <View
      accessibilityViewIsModal
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(27, 22, 19, 0.72)",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xl,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.xxl,
          padding: theme.spacing.xxl,
          gap: theme.spacing.xl,
        }}
      >
        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.color.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color={theme.color.accent} />
          </View>
          <Text variant="title">Paying {totalLabel}</Text>
          <Text variant="caption" color="tertiary" style={{ textAlign: "center" }}>
            Please keep this screen open. This only takes a few seconds.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          {STEPS.map((step, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;
            return (
              <View
                key={step.status}
                style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDone
                      ? theme.color.success
                      : isActive
                        ? theme.color.surfaceDark
                        : theme.color.surfaceMuted,
                  }}
                >
                  {isDone ? (
                    <Icon name="check" size={15} color={theme.color.textOnDark} />
                  ) : isActive ? (
                    <ActivityIndicator size="small" color={theme.color.textOnDark} />
                  ) : (
                    <Text variant="label" color="tertiary">
                      {index + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" color={isDone || isActive ? "primary" : "tertiary"}>
                    {step.title}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    {step.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.xs,
          }}
        >
          <Icon name="lock" size={12} color={theme.color.textTertiary} />
          <Text variant="caption" color="tertiary">
            Encrypted and processed by Stripe
          </Text>
        </View>
      </View>
    </View>
  );
}

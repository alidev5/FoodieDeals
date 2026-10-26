import { toCustomerSteps, type CustomerStep, type OrderStatus } from "@foodiedeals/shared";
import { Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { View } from "react-native";

import { formatClockTime } from "../../../lib/display";

export interface TrackerProps {
  status: OrderStatus;
  restaurantName?: string;
  createdAt?: string;
  acceptedAt?: string | null;
  readyAt?: string | null;
  /** Estimated ready time, shown on the Ready step until it happens. */
  estimatedReadyAt?: Date | null;
}

const STEP_COPY: Record<
  CustomerStep["key"],
  { description: (restaurant: string) => string; icon: IconName }
> = {
  waiting: { description: () => "Order sent to the kitchen", icon: "send" },
  accepted: { description: (restaurant) => `${restaurant} accepted your order`, icon: "thumbs-up" },
  preparing: { description: () => "The kitchen is cooking your food", icon: "coffee" },
  ready: { description: () => "Say your name at the counter", icon: "shopping-bag" },
};

export function Tracker({
  status,
  restaurantName = "The restaurant",
  createdAt,
  acceptedAt,
  readyAt,
  estimatedReadyAt,
}: TrackerProps) {
  const theme = useTheme();
  const steps = toCustomerSteps(status);
  const doneCount = steps.filter((step) => step.state === "done").length;

  const timeFor = (step: CustomerStep): string | null => {
    if (step.state === "active") return "Now";
    const iso = { waiting: createdAt, accepted: acceptedAt, preparing: acceptedAt, ready: readyAt }[
      step.key
    ];
    if (iso) return formatClockTime(new Date(iso));
    if (step.key === "ready" && estimatedReadyAt) return `~${formatClockTime(estimatedReadyAt)}`;
    return null;
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {steps.map((step, index) => (
          <View
            key={step.key}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: theme.color.line,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 5,
                width: index < doneCount ? "100%" : step.state === "active" ? "50%" : "0%",
                backgroundColor: theme.color.accent,
              }}
            />
          </View>
        ))}
      </View>

      <View>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isDone = step.state === "done";
          const isActive = step.state === "active";
          const time = timeFor(step);
          return (
            <View key={step.key} style={{ flexDirection: "row", gap: theme.spacing.lg }}>
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDone
                      ? theme.color.surfaceDark
                      : isActive
                        ? theme.color.accent
                        : theme.color.surface,
                    borderWidth: isDone || isActive ? 0 : 1.5,
                    borderColor: theme.color.line,
                    shadowColor: theme.color.accent,
                    shadowOpacity: isActive ? 0.35 : 0,
                    shadowRadius: 8,
                    elevation: isActive ? 4 : 0,
                  }}
                >
                  <Icon
                    name={isDone ? "check" : STEP_COPY[step.key].icon}
                    size={18}
                    color={isDone || isActive ? theme.color.textOnDark : theme.color.textTertiary}
                  />
                </View>
                {!isLast ? (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 18,
                      backgroundColor: isDone ? theme.color.surfaceDark : theme.color.line,
                    }}
                  />
                ) : null}
              </View>

              <View
                style={{ flex: 1, paddingBottom: isLast ? 0 : theme.spacing.lg, paddingTop: 2 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}
                  >
                    <Text
                      variant="heading"
                      color={
                        isActive ? "accent" : step.state === "upcoming" ? "tertiary" : "primary"
                      }
                    >
                      {step.label}
                    </Text>
                    {isActive ? (
                      <View
                        style={{
                          backgroundColor: theme.color.accentSoft,
                          borderRadius: theme.radius.pill,
                          paddingHorizontal: 6,
                        }}
                      >
                        <Text variant="label" color="accent" style={{ fontSize: 11 }}>
                          NOW
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {time ? (
                    <Text variant="caption" color={isActive ? "accent" : "tertiary"}>
                      {time}
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" color="tertiary">
                  {STEP_COPY[step.key].description(restaurantName)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

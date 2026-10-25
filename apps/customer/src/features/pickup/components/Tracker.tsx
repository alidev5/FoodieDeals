import { toCustomerSteps, type OrderStatus } from "@foodiedeals/shared";
import { Text, useTheme } from "@foodiedeals/ui-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export interface TrackerProps {
  status: OrderStatus;
}

function progressRatio(status: OrderStatus): number {
  const steps = toCustomerSteps(status);
  const doneCount = steps.filter((step) => step.state === "done").length;
  const hasActive = steps.some((step) => step.state === "active");
  return (doneCount + (hasActive ? 0.5 : 0)) / steps.length;
}

export function Tracker({ status }: TrackerProps) {
  const theme = useTheme();
  const steps = toCustomerSteps(status);
  const progress = useSharedValue(progressRatio(status));

  useEffect(() => {
    progress.value = withTiming(progressRatio(status), { duration: 320 });
  }, [status, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View
        style={{
          height: 4,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.line,
          overflow: "hidden",
        }}
      >
        <Animated.View style={[{ height: 4, backgroundColor: theme.color.accent }, fillStyle]} />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {steps.map((step) => (
          <View key={step.key} style={{ alignItems: "center", gap: theme.spacing.xs, flex: 1 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  step.state === "upcoming"
                    ? theme.color.surface
                    : step.state === "active"
                      ? theme.color.accent
                      : theme.color.text,
                borderWidth: step.state === "upcoming" ? 1.5 : 0,
                borderColor: theme.color.line,
              }}
            />
            <Text
              variant="caption"
              color={step.state === "upcoming" ? "tertiary" : step.state === "active" ? "accent" : "primary"}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

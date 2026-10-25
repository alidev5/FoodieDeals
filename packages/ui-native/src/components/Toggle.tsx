import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

import { useTheme } from "../theme";

import { StatusDot } from "./Badge";
import { Text } from "./Text";

export interface ToggleProps {
  isOn: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: (next: boolean) => void;
}

export function Toggle({ isOn, onLabel, offLabel, onToggle }: ToggleProps) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(isOn ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isOn ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isOn, progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.color.line, theme.color.surfaceDark],
  });

  return (
    <Pressable onPress={() => onToggle(!isOn)}>
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          backgroundColor,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        {isOn ? <StatusDot tone="success" /> : null}
        <View>
          <Text variant="label" color={isOn ? "onDark" : "secondary"}>
            {isOn ? onLabel : offLabel}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

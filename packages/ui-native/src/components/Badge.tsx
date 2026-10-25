import { View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Text } from "./Text";

export interface BadgeProps {
  label: string;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, bordered = true, style }: BadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.pill,
          borderWidth: bordered ? 1 : 0,
          borderColor: theme.color.line,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text variant="label" color="primary">
        {label}
      </Text>
    </View>
  );
}

export interface StatusDotProps {
  tone?: "success" | "accent";
  style?: StyleProp<ViewStyle>;
}

export function StatusDot({ tone = "success", style }: StatusDotProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: tone === "success" ? theme.color.success : theme.color.accent,
        },
        style,
      ]}
    />
  );
}

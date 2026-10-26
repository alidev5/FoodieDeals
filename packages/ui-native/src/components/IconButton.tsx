import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Icon, type IconName } from "./Icon";

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  variant?: "light" | "dark";
  size?: number;
  /** Shows a small accent dot, e.g. for unread notifications. */
  hasDot?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  variant = "light",
  size = 44,
  hasDot = false,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const isDark = variant === "dark";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? theme.color.surfaceDark : theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
          shadowColor: theme.shadow.card.color,
          shadowOpacity: isDark ? 0 : theme.shadow.card.opacity,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      <Icon
        name={icon}
        size={size * 0.42}
        color={isDark ? theme.color.textOnDark : theme.color.text}
      />
      {hasDot ? (
        <View
          style={{
            position: "absolute",
            top: size * 0.24,
            right: size * 0.26,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: theme.color.accent,
          }}
        />
      ) : null}
    </Pressable>
  );
}

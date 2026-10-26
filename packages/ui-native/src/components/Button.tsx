import type { ReactNode } from "react";
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type ButtonVariant = "dark" | "accent" | "gold" | "muted" | "outline" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  icon?: IconName;
  trailingIcon?: IconName;
  /** Right-aligned content, e.g. the total on a pay button. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = "dark",
  size = "md",
  icon,
  trailingIcon,
  trailing,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const background: Record<ButtonVariant, string> = {
    dark: theme.color.surfaceDark,
    accent: theme.color.accent,
    gold: theme.color.gold,
    muted: theme.color.surfaceMuted,
    outline: "transparent",
    ghost: "transparent",
  };
  const isLightText = variant === "dark" || variant === "accent";
  const foreground = isLightText ? theme.color.textOnDark : theme.color.text;
  const isLarge = size === "lg";

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flexDirection: "row",
          backgroundColor: background[variant],
          borderRadius: isLarge ? theme.radius.lg : theme.radius.pill,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: theme.color.surfaceDark,
          paddingVertical: isLarge ? theme.spacing.lg + 2 : theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          alignItems: "center",
          justifyContent: trailing ? "space-between" : "center",
          gap: theme.spacing.sm,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
        variant === "accent" && isLarge
          ? {
              shadowColor: theme.color.accent,
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }
          : null,
        style,
      ]}
      {...rest}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        {icon ? <Icon name={icon} size={isLarge ? 20 : 17} color={foreground} /> : null}
        <Text variant={isLarge ? "heading" : "bodyStrong"} style={{ color: foreground }}>
          {label}
        </Text>
        {trailingIcon ? (
          <Icon name={trailingIcon} size={isLarge ? 20 : 17} color={foreground} />
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

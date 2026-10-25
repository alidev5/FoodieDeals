import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Text } from "./Text";

export type ButtonVariant = "dark" | "accent" | "outline" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = "dark", disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();

  const background =
    variant === "dark"
      ? theme.color.surfaceDark
      : variant === "accent"
        ? theme.color.accent
        : "transparent";

  const borderColor =
    variant === "outline" ? theme.color.surfaceDark : variant === "ghost" ? "transparent" : background;

  const textColor = variant === "outline" || variant === "ghost" ? "primary" : "onDark";

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: background,
          borderRadius: theme.radius.pill,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Text variant="label" color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
}

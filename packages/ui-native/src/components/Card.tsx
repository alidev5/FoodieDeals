import type { Theme } from "@foodiedeals/shared";
import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

export type CardVariant = "light" | "dark" | "outline";

export interface CardProps extends PropsWithChildren {
  variant?: CardVariant;
  radius?: keyof Theme["radius"];
  padding?: keyof Theme["spacing"];
  style?: StyleProp<ViewStyle>;
}

export function Card({ variant = "light", radius = "lg", padding = "lg", children, style }: CardProps) {
  const theme = useTheme();

  const backgroundColor = variant === "dark" ? theme.color.surfaceDark : theme.color.surface;
  const shadow = theme.shadow.card;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: theme.radius[radius],
          padding: theme.spacing[padding],
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: theme.color.text,
          shadowColor: shadow.color,
          shadowOpacity: variant === "outline" ? 0 : shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
          elevation: variant === "outline" ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

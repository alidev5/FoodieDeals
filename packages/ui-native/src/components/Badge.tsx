import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type BadgeTone =
  "neutral" | "muted" | "accent" | "accentSolid" | "gold" | "goldSoft" | "success" | "dark";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  /** Leading status dot in the tone's foreground color. */
  dot?: boolean;
  size?: "sm" | "md";
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function useBadgeColors(tone: BadgeTone) {
  const { color } = useTheme();
  const palette: Record<BadgeTone, { background: string; foreground: string }> = {
    neutral: { background: color.surface, foreground: color.text },
    muted: { background: color.surfaceMuted, foreground: color.textSecondary },
    accent: { background: color.accentSoft, foreground: color.accent },
    accentSolid: { background: color.accent, foreground: color.textOnDark },
    gold: { background: color.gold, foreground: color.text },
    goldSoft: { background: color.goldSoft, foreground: color.text },
    success: { background: color.successSoft, foreground: color.success },
    dark: { background: "rgba(27, 22, 19, 0.82)", foreground: color.textOnDark },
  };
  return palette[tone];
}

export function Badge({
  label,
  tone = "neutral",
  icon,
  dot = false,
  size = "md",
  trailing,
  style,
}: BadgeProps) {
  const theme = useTheme();
  const colors = useBadgeColors(tone);
  const isSmall = size === "sm";

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs + 2,
          backgroundColor: colors.background,
          borderRadius: theme.radius.pill,
          paddingVertical: isSmall ? 3 : theme.spacing.xs + 2,
          paddingHorizontal: isSmall ? theme.spacing.sm : theme.spacing.md,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {dot ? (
        <View
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.foreground }}
        />
      ) : null}
      {icon ? <Icon name={icon} size={isSmall ? 12 : 14} color={colors.foreground} /> : null}
      <Text variant="label" style={{ color: colors.foreground, fontSize: isSmall ? 11 : 13 }}>
        {label}
      </Text>
      {trailing}
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

import { IconButton, Text, useTheme } from "@foodiedeals/ui-native";
import type { ReactNode } from "react";
import { View } from "react-native";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: ReactNode;
}

/** Centered title with a round back button, matching the checkout and pickup screens. */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
      <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ width: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

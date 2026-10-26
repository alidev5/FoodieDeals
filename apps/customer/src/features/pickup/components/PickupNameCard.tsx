import { Badge, GradientFill, Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

import { LiveIndicator } from "./LiveIndicator";

export interface PickupNameCardProps {
  pickupName: string;
  orderNumber: number;
}

export function PickupNameCard({ pickupName, orderNumber }: PickupNameCardProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius.xxl,
        backgroundColor: theme.color.surfaceDark,
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
        overflow: "hidden",
      }}
    >
      <GradientFill
        borderRadius={theme.radius.xxl}
        layers={[
          {
            kind: "radial",
            center: { x: 1, y: 0 },
            radius: 0.95,
            stops: [
              { offset: 0, color: theme.color.accent, opacity: 1 },
              { offset: 1, color: theme.color.accent, opacity: 0 },
            ],
          },
          {
            kind: "radial",
            center: { x: 0, y: 1 },
            radius: 0.55,
            stops: [
              { offset: 0, color: theme.color.gold, opacity: 0.9 },
              { offset: 1, color: theme.color.gold, opacity: 0 },
            ],
          },
        ]}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Badge label={`Order #${orderNumber}`} tone="gold" icon="file-text" />
        <LiveIndicator />
      </View>

      <View>
        <Text variant="body" color="onDark">
          At the counter, just say
        </Text>
        <Text variant="hero" color="onDark" numberOfLines={1} adjustsFontSizeToFit>
          {pickupName}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <Icon name="check" size={15} color={theme.color.gold} />
        <Text variant="caption" color="onDark" style={{ flex: 1 }}>
          If they ask, show order #{orderNumber}. Nothing else needed.
        </Text>
      </View>
    </View>
  );
}

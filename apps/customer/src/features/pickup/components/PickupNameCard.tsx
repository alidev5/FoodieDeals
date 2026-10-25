import { Card, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

import { LiveIndicator } from "./LiveIndicator";

export interface PickupNameCardProps {
  pickupName: string;
  orderNumber: number;
}

export function PickupNameCard({ pickupName, orderNumber }: PickupNameCardProps) {
  const theme = useTheme();

  return (
    <Card variant="dark" padding="lg">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
            Order #{orderNumber}
          </Text>
          <Text variant="title" color="onDark">
            {pickupName}
          </Text>
          <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
            Say this name at the counter
          </Text>
        </View>
        <LiveIndicator />
      </View>
    </Card>
  );
}

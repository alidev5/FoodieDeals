import { formatCents } from "@foodiedeals/shared";
import { Badge, Text, useTheme } from "@foodiedeals/ui-native";
import { Pressable, View } from "react-native";

import type { RestaurantOrder } from "../../../lib/restaurantApi";

export interface OrderCardProps {
  order: RestaurantOrder;
  isSelected: boolean;
  isHighlighted?: boolean;
  onPress: () => void;
}

export function OrderCard({ order, isSelected, isHighlighted = false, onPress }: OrderCardProps) {
  const theme = useTheme();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: isHighlighted ? theme.color.background : theme.color.surface,
        borderRadius: theme.radius.md,
        borderWidth: isSelected || isHighlighted ? 1.5 : 1,
        borderColor: isHighlighted ? theme.color.accent : isSelected ? theme.color.text : theme.color.line,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="heading">#{order.orderNumber}</Text>
        <Badge label={order.status.replace("_", " ")} bordered={false} />
      </View>
      <Text variant="body">{order.pickupName}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="caption" color="secondary">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </Text>
        <Text variant="caption" color="secondary">
          {formatCents(order.totalCents)}
        </Text>
      </View>
    </Pressable>
  );
}

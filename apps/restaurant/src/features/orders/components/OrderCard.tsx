import { formatCents } from "@foodiedeals/shared";
import { Badge, Icon, OrderStatusBadge, Text, useTheme } from "@foodiedeals/ui-native";
import { Pressable, View } from "react-native";

import type { RestaurantOrder } from "../../../lib/restaurantApi";
import { dealShortLabel, relativeTime } from "../format";

export interface OrderCardProps {
  order: RestaurantOrder;
  isSelected: boolean;
  isHighlighted?: boolean;
  onPress: () => void;
}

export function OrderCard({ order, isSelected, isHighlighted = false, onPress }: OrderCardProps) {
  const theme = useTheme();
  const itemsLine = order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
  const dealLabel = dealShortLabel(order.appliedDealName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Order ${order.orderNumber} for ${order.pickupName}`}
      style={({ hovered, pressed }) => ({
        backgroundColor: isHighlighted ? theme.color.accentSoft : theme.color.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        borderColor: isSelected
          ? theme.color.surfaceDark
          : isHighlighted
            ? theme.color.accent
            : hovered
              ? theme.color.textTertiary
              : theme.color.line,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {isSelected ? (
        <View
          style={{
            position: "absolute",
            left: -1.5,
            top: 18,
            bottom: 18,
            width: 4,
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            backgroundColor: theme.color.accent,
          }}
        />
      ) : null}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            flexShrink: 1,
          }}
        >
          <Text variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {order.pickupName}
          </Text>
          {order.status === "WAITING" ? <Badge label="NEW" tone="accentSolid" size="sm" /> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="clock" size={12} color={theme.color.textTertiary} />
          <Text variant="caption" color="tertiary">
            #{order.orderNumber} · {relativeTime(order.createdAt)}
          </Text>
        </View>
      </View>
      <Text variant="body" color="secondary" numberOfLines={1}>
        {itemsLine}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        {dealLabel ? <Badge label={dealLabel} tone="gold" size="sm" /> : null}
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Paid · {formatCents(order.totalCents)}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>
    </Pressable>
  );
}

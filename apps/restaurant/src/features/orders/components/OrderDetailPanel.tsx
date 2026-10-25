import { formatCents, nextAction } from "@foodiedeals/shared";
import { Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import { ScrollView, View } from "react-native";

import type { RestaurantOrder } from "../../../lib/restaurantApi";

export interface OrderDetailPanelProps {
  order: RestaurantOrder | null;
  onAdvance: (orderId: string) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export function OrderDetailPanel({ order, onAdvance }: OrderDetailPanelProps) {
  const theme = useTheme();

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text variant="body" color="secondary">
          Select an order
        </Text>
      </View>
    );
  }

  const action = nextAction(order.status);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.md, gap: theme.spacing.lg }}
    >
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="title">Order #{order.orderNumber}</Text>
        <Text variant="body" color="secondary">
          {order.pickupName}
        </Text>
      </View>

      <Card padding="lg">
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Items</Text>
          {order.items.map((item) => (
            <View key={item.name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="body" color="secondary">
                {item.quantity}× {item.name}
              </Text>
              <Text variant="body">{formatCents(item.priceCents * item.quantity)}</Text>
            </View>
          ))}
          {order.appliedDealName ? (
            <Text variant="caption" color="accent">
              Deal applied: {order.appliedDealName}
            </Text>
          ) : null}
        </View>
      </Card>

      <Card padding="lg">
        <View style={{ gap: theme.spacing.sm }}>
          <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
          {order.discountCents > 0 ? (
            <Row label="Discount" value={`-${formatCents(order.discountCents)}`} />
          ) : null}
          <Row label="Tax" value={formatCents(order.taxCents)} />
          <View style={{ borderTopWidth: 1, borderTopColor: theme.color.line, paddingTop: theme.spacing.sm }}>
            <Row label="Total" value={formatCents(order.totalCents)} />
          </View>
        </View>
      </Card>

      <Card padding="lg" style={{ backgroundColor: theme.color.background }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Payout split</Text>
          <Row label="Platform fee" value={formatCents(order.platformFeeCents)} />
          <Row label="You receive" value={formatCents(order.restaurantReceivesCents)} />
        </View>
      </Card>

      {action ? (
        <Button label={action.label} variant="accent" onPress={() => onAdvance(order.id)} />
      ) : (
        <Button label="Picked up" variant="outline" disabled onPress={() => undefined} />
      )}
    </ScrollView>
  );
}

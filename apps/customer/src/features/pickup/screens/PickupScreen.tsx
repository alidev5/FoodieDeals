import type { Quote } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Card, Text, useTheme } from "@foodiedeals/ui-native";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PriceSummary } from "../../checkout/components/PriceSummary";
import { useOrder } from "../../orders/hooks/useOrder";
import { useOrderSocket } from "../../orders/hooks/useOrderSocket";
import { PickupNameCard } from "../components/PickupNameCard";
import { RestaurantContactCard } from "../components/RestaurantContactCard";
import { Tracker } from "../components/Tracker";

export interface PickupScreenProps {
  orderId: string | undefined;
}

export function PickupScreen({ orderId }: PickupScreenProps) {
  const theme = useTheme();
  const { data: order, isLoading } = useOrder(orderId);
  useOrderSocket(orderId);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.accent} />
      </SafeAreaView>
    );
  }

  const quote: Quote = {
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    platformFeeCents: order.platformFeeCents,
    restaurantReceivesCents: order.restaurantReceivesCents,
    appliedDeal: null,
    dealEvaluations: [],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title">Your order</Text>

        <PickupNameCard pickupName={order.pickupName} orderNumber={order.orderNumber} />

        <Card padding="lg">
          <Tracker status={order.status} />
        </Card>

        <RestaurantContactCard
          name={order.restaurant.name}
          address={order.restaurant.address ?? order.restaurant.name}
          phone={order.restaurant.phone ?? ""}
        />

        <Card padding="lg">
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="heading">Order summary</Text>
            {order.items.map((item, index) => (
              <View key={`${item.name}-${index}`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
            <View style={{ borderTopWidth: 1, borderTopColor: theme.color.line, paddingTop: theme.spacing.sm }}>
              <PriceSummary quote={quote} />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

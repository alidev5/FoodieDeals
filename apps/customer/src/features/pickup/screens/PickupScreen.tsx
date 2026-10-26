import { formatCents, type OrderStatus } from "@foodiedeals/shared";
import { Card, Icon, IconButton, Text, useTheme } from "@foodiedeals/ui-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "../../../components/ScreenHeader";
import { formatClockTime, shortDealName, shortRestaurantName } from "../../../lib/display";
import { TAB_BAR_CLEARANCE } from "../../home/components/TabBar";
import { useOrder } from "../../orders/hooks/useOrder";
import { useOrderUpdates } from "../../orders/hooks/useOrderUpdates";
import { PickupNameCard } from "../components/PickupNameCard";
import { RestaurantContactCard } from "../components/RestaurantContactCard";
import { Tracker } from "../components/Tracker";

export interface PickupScreenProps {
  orderId: string | undefined;
}

const STATUS_TITLE: Record<OrderStatus, string> = {
  WAITING: "Waiting for the kitchen",
  ACCEPTED: "Preparing your order",
  READY: "Ready for pickup!",
  PICKED_UP: "Enjoy your meal",
};

export function PickupScreen({ orderId }: PickupScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(orderId);
  useOrderUpdates(orderId);

  if (isLoading || !order) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.color.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.color.accent} />
      </SafeAreaView>
    );
  }

  const prepMinutes = order.restaurant.prepMinutesMax ?? order.restaurant.prepMinutesMin;
  const estimatedReadyAt =
    prepMinutes && !order.readyAt
      ? new Date(new Date(order.acceptedAt ?? order.createdAt).getTime() + prepMinutes * 60_000)
      : null;
  const minutesLeft = estimatedReadyAt
    ? Math.max(1, Math.round((estimatedReadyAt.getTime() - Date.now()) / 60_000))
    : null;
  const isInProgress = order.status === "WAITING" || order.status === "ACCEPTED";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
      >
        <ScreenHeader
          title={`Order #${order.orderNumber}`}
          subtitle={`Paid in app · ${formatCents(order.totalCents)}`}
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          right={
            <IconButton
              icon="help-circle"
              accessibilityLabel="Call the restaurant for help"
              onPress={() =>
                order.restaurant.phone && Linking.openURL(`tel:${order.restaurant.phone}`)
              }
            />
          }
        />

        <PickupNameCard pickupName={order.pickupName} orderNumber={order.orderNumber} />

        <Card style={{ gap: theme.spacing.lg }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="title">{STATUS_TITLE[order.status]}</Text>
            {isInProgress && estimatedReadyAt && minutesLeft ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                <Icon name="clock" size={14} color={theme.color.accent} />
                <Text variant="body" color="secondary">
                  Ready in about {minutesLeft} min · around {formatClockTime(estimatedReadyAt)}
                </Text>
              </View>
            ) : null}
          </View>

          <Tracker
            status={order.status}
            restaurantName={shortRestaurantName(order.restaurant.name)}
            createdAt={order.createdAt}
            acceptedAt={order.acceptedAt}
            readyAt={order.readyAt}
            estimatedReadyAt={estimatedReadyAt}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              backgroundColor: theme.color.surfaceMuted,
              borderRadius: theme.radius.pill,
              paddingVertical: theme.spacing.sm + 2,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Icon name="bell" size={15} color={theme.color.textSecondary} />
            <Text variant="caption" color="secondary">
              Updates on its own — no need to refresh
            </Text>
          </View>
        </Card>

        <RestaurantContactCard
          name={order.restaurant.name}
          address={order.restaurant.address ?? order.restaurant.name}
          phone={order.restaurant.phone ?? ""}
          heroPhoto={order.restaurant.heroPhoto}
          restaurantId={order.restaurantId}
        />

        <Card style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.xs,
            }}
          >
            <Text variant="heading">Order summary</Text>
            <Text variant="caption" color="tertiary">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </Text>
          </View>
          {order.items.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text variant="body" color="secondary">
                {item.quantity}× {item.name}
              </Text>
              <Text variant="bodyStrong">{formatCents(item.priceCents * item.quantity)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="body" color="secondary">
              Paid · Visa •••• 4242
            </Text>
            <Text variant="bodyStrong">{formatCents(order.totalCents)}</Text>
          </View>
          {order.discountCents > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                backgroundColor: theme.color.successSoft,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                marginTop: theme.spacing.xs,
              }}
            >
              <Icon name="gift" size={16} color={theme.color.success} />
              <Text variant="bodyStrong" color="success" style={{ flex: 1 }}>
                You saved {formatCents(order.discountCents)}
                {order.appliedDealName ? ` with ${shortDealName(order.appliedDealName)}` : ""}
              </Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

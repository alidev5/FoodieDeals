import { formatCents } from "@foodiedeals/shared";
import {
  Button,
  EmptyState,
  LoadingState,
  OrderStatusBadge,
  Text,
  useTheme,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { TAB_BAR_CLEARANCE } from "../../home/components/TabBar";
import { useMyOrders } from "../../home/hooks/useCustomerSummary";

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function OrderHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: orders, isLoading } = useMyOrders();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={orders ?? []}
        keyExtractor={(order) => order.id}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
            <Text variant="display">Your orders</Text>
            <Text variant="body" color="secondary">
              Tap an order to see its live pickup status.
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Loading your orders" />
          ) : (
            <EmptyState
              icon="shopping-bag"
              title="No orders yet"
              body="Your pickups show up here with live status while the kitchen works on them."
              action={
                <Button
                  label="Browse deals"
                  icon="compass"
                  variant="dark"
                  onPress={() => router.replace("/home")}
                />
              }
            />
          )
        }
        renderItem={({ item: order }) => {
          const photo = resolveFoodPhoto(order.restaurant.heroPhoto ?? undefined);
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <Pressable
              onPress={() => router.push(`/pickup?orderId=${order.id}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.md,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.md,
                  overflow: "hidden",
                  backgroundColor: theme.color.surfaceMuted,
                }}
              >
                {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {order.restaurant.name}
                </Text>
                <Text variant="caption" color="tertiary">
                  #{order.orderNumber} · {DATE_FORMAT.format(new Date(order.createdAt))} ·{" "}
                  {itemCount} item{itemCount === 1 ? "" : "s"} · {formatCents(order.totalCents)}
                </Text>
              </View>
              <OrderStatusBadge status={order.status} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

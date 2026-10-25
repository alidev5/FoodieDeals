import type { OrderStatus } from "@foodiedeals/shared";
import { useTheme } from "@foodiedeals/ui-native";
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { OrderAction } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";
import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { Header } from "../components/Header";
import { OrderCard } from "../components/OrderCard";
import { OrderDetailPanel } from "../components/OrderDetailPanel";
import { StatCards } from "../components/StatCards";
import { Tabs, type OrdersTab } from "../components/Tabs";
import { useApplyAction } from "../hooks/useApplyAction";
import { useOrders } from "../hooks/useOrders";
import { useOrdersSocket } from "../hooks/useOrdersSocket";
import { useSetAvailability } from "../hooks/useSetAvailability";
import { useStats } from "../hooks/useStats";

const TAB_STATUSES: Record<OrdersTab, OrderStatus[]> = {
  ACTIVE: ["WAITING", "ACCEPTED"],
  READY: ["READY"],
  DONE: ["PICKED_UP"],
};

const ACTION_FOR_STATUS: Record<OrderStatus, OrderAction | null> = {
  WAITING: "ACCEPT",
  ACCEPTED: "MARK_READY",
  READY: "PICKED_UP",
  PICKED_UP: null,
};

export function OrdersScreen() {
  const theme = useTheme();
  const { data: session } = useRestaurantSession();
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.find((candidate) => candidate.id === session?.restaurantId);

  const { data: orders, isLoading } = useOrders();
  const { data: stats } = useStats();
  const { highlightedOrderId } = useOrdersSocket();
  const applyAction = useApplyAction();
  const setAvailability = useSetAvailability();

  const [tab, setTab] = useState<OrdersTab>("ACTIVE");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const visibleOrders = useMemo(
    () => (orders ?? []).filter((order) => TAB_STATUSES[tab].includes(order.status)),
    [orders, tab],
  );

  const selectedOrder = orders?.find((order) => order.id === selectedOrderId) ?? visibleOrders[0] ?? null;

  const handleAdvance = (orderId: string) => {
    const order = orders?.find((candidate) => candidate.id === orderId);
    const action = order ? ACTION_FOR_STATUS[order.status] : null;
    if (action) {
      applyAction.mutate({ orderId, action });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View
          style={{
            width: 360,
            borderRightWidth: 1,
            borderRightColor: theme.color.line,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <Header
            restaurantName={restaurant?.name ?? "Restaurant"}
            isOpen={restaurant?.isOpen ?? true}
            onToggleOpen={(next) => setAvailability.mutate(next)}
          />
          {stats ? <StatCards stats={stats} /> : null}
          <Tabs selected={tab} onSelect={setTab} />
          {isLoading ? (
            <ActivityIndicator color={theme.color.accent} />
          ) : (
            <FlashList
              data={visibleOrders}
              keyExtractor={(order) => order.id}
              estimatedItemSize={96}
              ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
              renderItem={({ item }) => (
                <OrderCard
                  order={item}
                  isSelected={item.id === selectedOrder?.id}
                  isHighlighted={item.id === highlightedOrderId}
                  onPress={() => setSelectedOrderId(item.id)}
                />
              )}
            />
          )}
        </View>

        <OrderDetailPanel order={selectedOrder} onAdvance={handleAdvance} />
      </View>
    </SafeAreaView>
  );
}

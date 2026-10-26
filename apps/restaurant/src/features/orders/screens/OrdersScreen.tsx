import type { OrderStatus } from "@foodiedeals/shared";
import { EmptyState, LoadingState, useTheme } from "@foodiedeals/ui-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import type { OrderAction, RestaurantOrder } from "../../../lib/restaurantApi";
import { useDashboardLayout } from "../../../lib/useDashboardLayout";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";
import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { DashboardShell } from "../../shell/components/DashboardShell";
import { Header } from "../components/Header";
import { OrderCard } from "../components/OrderCard";
import { OrderDetailPanel } from "../components/OrderDetailPanel";
import { StatCards } from "../components/StatCards";
import { Tabs, type OrdersTab } from "../components/Tabs";
import { useApplyAction } from "../hooks/useApplyAction";
import { useOrders } from "../hooks/useOrders";
import { useSetAvailability } from "../hooks/useSetAvailability";
import { useStats } from "../hooks/useStats";
import { useHighlightedOrderId } from "../OrderAlertsProvider";

const TAB_STATUSES: Record<OrdersTab, OrderStatus[]> = {
  ACTIVE: ["WAITING", "ACCEPTED"],
  READY: ["READY"],
  DONE: ["PICKED_UP"],
};

const TAB_FOR_STATUS: Record<OrderStatus, OrdersTab> = {
  WAITING: "ACTIVE",
  ACCEPTED: "ACTIVE",
  READY: "READY",
  PICKED_UP: "DONE",
};

const ACTION_FOR_STATUS: Record<OrderStatus, OrderAction | null> = {
  WAITING: "ACCEPT",
  ACCEPTED: "MARK_READY",
  READY: "PICKED_UP",
  PICKED_UP: null,
};

export function OrdersScreen() {
  const theme = useTheme();
  const { isStacked } = useDashboardLayout();
  const { orderId: linkedOrderId } = useLocalSearchParams<{ orderId?: string }>();
  const { data: session } = useRestaurantSession();
  const { data: restaurants } = useRestaurants();
  const restaurant = restaurants?.find((candidate) => candidate.id === session?.restaurantId);

  const { data: orders, isLoading } = useOrders();
  const { data: stats } = useStats();
  const highlightedOrderId = useHighlightedOrderId();
  const applyAction = useApplyAction();
  const setAvailability = useSetAvailability();

  const [tab, setTab] = useState<OrdersTab>("ACTIVE");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const handledLinkRef = useRef<string | null>(null);

  // A toast's "Open order" links here with ?orderId=, which selects it on the right tab.
  useEffect(() => {
    const linked = linkedOrderId ? orders?.find((order) => order.id === linkedOrderId) : null;
    if (linked && handledLinkRef.current !== linked.id) {
      handledLinkRef.current = linked.id;
      setTab(TAB_FOR_STATUS[linked.status]);
      setSelectedOrderId(linked.id);
    }
  }, [linkedOrderId, orders]);

  const visibleOrders = useMemo(
    () => (orders ?? []).filter((order) => TAB_STATUSES[tab].includes(order.status)),
    [orders, tab],
  );

  const counts = useMemo(
    () => ({
      ACTIVE: (orders ?? []).filter((order) => TAB_STATUSES.ACTIVE.includes(order.status)).length,
      READY: (orders ?? []).filter((order) => order.status === "READY").length,
      DONE: stats?.doneToday ?? 0,
    }),
    [orders, stats],
  );

  const selectedOrder =
    visibleOrders.find((order) => order.id === selectedOrderId) ??
    orders?.find((order) => order.id === selectedOrderId) ??
    visibleOrders[0] ??
    null;
  const selectedId = selectedOrder?.id ?? null;

  const handleAdvance = (orderId: string) => {
    const order = orders?.find((candidate) => candidate.id === orderId);
    const action = order ? ACTION_FOR_STATUS[order.status] : null;
    if (action) {
      applyAction.mutate({ orderId, action });
    }
  };

  const menuPhotos = useMemo(
    () => Object.fromEntries((restaurant?.menu ?? []).map((item) => [item.id, item.photo])),
    [restaurant],
  );

  const renderCard = (order: RestaurantOrder) => (
    <OrderCard
      order={order}
      isSelected={order.id === selectedId}
      isHighlighted={order.id === highlightedOrderId}
      onPress={() => setSelectedOrderId(order.id)}
    />
  );

  const emptyList = (
    <EmptyState
      icon="coffee"
      title={tab === "ACTIVE" ? "All caught up" : tab === "READY" ? "Nothing waiting" : "None yet"}
      body={
        tab === "ACTIVE"
          ? "New paid orders appear here instantly, with a chime."
          : tab === "READY"
            ? "Orders you mark ready show up here until they're collected."
            : "Collected orders from today are listed here."
      }
      style={{ paddingVertical: theme.spacing.xl }}
    />
  );

  const header = (
    <>
      <Header
        title="Orders"
        isOpen={restaurant?.isOpen ?? true}
        onToggleOpen={(next) => setAvailability.mutate(next)}
      />
      {stats ? <StatCards stats={stats} /> : null}
    </>
  );

  const detail = (
    <OrderDetailPanel
      order={selectedOrder}
      onAdvance={handleAdvance}
      prepMinutes={restaurant?.prepMinutesMax}
      menuPhotos={menuPhotos}
      scrollable={!isStacked}
    />
  );

  if (isStacked) {
    return (
      <DashboardShell>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          {header}
          <Tabs selected={tab} onSelect={setTab} counts={counts} />
          {isLoading ? (
            <LoadingState message="Loading orders" />
          ) : visibleOrders.length === 0 ? (
            emptyList
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {visibleOrders.map((order) => (
                <View key={order.id}>{renderCard(order)}</View>
              ))}
            </View>
          )}
          {detail}
        </ScrollView>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <View style={{ flex: 1, minHeight: 0, padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        {header}
        <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: theme.spacing.lg }}>
          <View
            style={{
              flexGrow: 0,
              flexShrink: 1,
              flexBasis: 400,
              minWidth: 300,
              minHeight: 0,
              gap: theme.spacing.md,
            }}
          >
            <Tabs selected={tab} onSelect={setTab} counts={counts} />
            {isLoading ? (
              <LoadingState message="Loading orders" />
            ) : (
              <View style={{ flex: 1, minHeight: 0 }}>
                <FlashList
                  data={visibleOrders}
                  extraData={`${selectedId}:${highlightedOrderId}`}
                  keyExtractor={(order) => order.id}
                  estimatedItemSize={140}
                  contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
                  ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
                  ListEmptyComponent={emptyList}
                  renderItem={({ item }) => renderCard(item)}
                />
              </View>
            )}
          </View>
          {detail}
        </View>
      </View>
    </DashboardShell>
  );
}

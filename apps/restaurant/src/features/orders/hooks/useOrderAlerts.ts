import {
  REALTIME_EVENTS,
  restaurantTopic,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
} from "@foodiedeals/shared";
import { useBroadcast, usePollingFallback } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import chimeSource from "../../../../assets/chime.wav";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

import { useOrders } from "./useOrders";

export interface NewOrderAlert {
  orderId: string;
  orderNumber: number;
}

const HIGHLIGHT_MS = 6000;
const MAX_VISIBLE_ALERTS = 3;
const POLL_MS = 5000;

/**
 * Keeps the dashboard live and announces each new order once, with the chime and a toast.
 * Orders arrive over realtime when it's available; otherwise polling finds them, and any order
 * that appears in the list for the first time is announced the same way.
 */
export function useOrderAlerts() {
  const queryClient = useQueryClient();
  const { data: session } = useRestaurantSession();
  const { data: orders } = useOrders();
  const chime = useAudioPlayer(chimeSource);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<NewOrderAlert[]>([]);
  const knownOrderIds = useRef<Set<string> | null>(null);

  const dismissAlert = useCallback(
    (orderId: string) =>
      setAlerts((current) => current.filter((alert) => alert.orderId !== orderId)),
    [],
  );

  const refresh = useCallback(() => {
    if (!session) return;
    void queryClient.invalidateQueries({ queryKey: ["restaurant-orders", session.restaurantId] });
    void queryClient.invalidateQueries({ queryKey: ["restaurant-stats", session.restaurantId] });
  }, [queryClient, session]);

  const announce = useCallback(
    (alert: NewOrderAlert) => {
      const known = knownOrderIds.current;
      if (!known || known.has(alert.orderId)) return;
      known.add(alert.orderId);

      setHighlightedOrderId(alert.orderId);
      setAlerts((current) => [alert, ...current].slice(0, MAX_VISIBLE_ALERTS));
      chime.seekTo(0);
      chime.play();
      setTimeout(
        () => setHighlightedOrderId((current) => (current === alert.orderId ? null : current)),
        HIGHLIGHT_MS,
      );
    },
    [chime],
  );

  useEffect(() => {
    knownOrderIds.current = null;
    setAlerts([]);
  }, [session?.restaurantId]);

  // The first list we see is the backlog, not news; anything that shows up after it is announced.
  useEffect(() => {
    if (!orders) return;
    if (!knownOrderIds.current) {
      knownOrderIds.current = new Set(orders.map((order) => order.id));
      return;
    }
    for (const order of orders) {
      if (order.status === "WAITING") {
        announce({ orderId: order.id, orderNumber: order.orderNumber });
      } else {
        knownOrderIds.current.add(order.id);
      }
    }
  }, [orders, announce]);

  const isLive = useBroadcast(
    session ? restaurantTopic(session.restaurantId, session.demoKey) : null,
    {
      [REALTIME_EVENTS.orderCreated]: (payload) => {
        const created = payload as OrderCreatedPayload;
        if (created.restaurantId !== session?.restaurantId) return;
        refresh();
        announce({ orderId: created.orderId, orderNumber: created.orderNumber });
      },
      [REALTIME_EVENTS.orderStatusChanged]: (payload) => {
        if ((payload as OrderStatusChangedPayload).restaurantId === session?.restaurantId)
          refresh();
      },
    },
    refresh,
  );

  usePollingFallback(isLive, POLL_MS, refresh);

  return { highlightedOrderId, alerts, dismissAlert };
}

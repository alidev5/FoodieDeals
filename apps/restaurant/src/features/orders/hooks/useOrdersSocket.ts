import {
  SOCKET_EVENTS,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
} from "@foodiedeals/shared";
import { useSocket } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioPlayer } from "expo-audio";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import chimeSource from "../../../../assets/chime.wav";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

export function useOrdersSocket() {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { data: session } = useRestaurantSession();
  const chime = useAudioPlayer(chimeSource);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders", session.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-stats", session.restaurantId] });
    };

    const joinRoom = () => {
      socket.emit(SOCKET_EVENTS.joinRestaurantRoom, {
        restaurantId: session.restaurantId,
        demoKey: session.demoKey,
      });
      invalidate();
    };

    const onOrderCreated = (payload: OrderCreatedPayload) => {
      if (payload.restaurantId !== session.restaurantId) return;
      invalidate();
      setHighlightedOrderId(payload.orderId);
      chime.seekTo(0);
      chime.play();
      setTimeout(() => setHighlightedOrderId(null), 4000);
    };

    const onStatusChanged = (payload: OrderStatusChangedPayload) => {
      if (payload.restaurantId !== session.restaurantId) return;
      invalidate();
    };

    const onAppStateChange = (state: string) => {
      if (state === "active") {
        joinRoom();
      }
    };

    joinRoom();
    socket.on("connect", joinRoom);
    socket.on(SOCKET_EVENTS.orderCreated, onOrderCreated);
    socket.on(SOCKET_EVENTS.orderStatusChanged, onStatusChanged);
    const appStateSubscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(SOCKET_EVENTS.orderCreated, onOrderCreated);
      socket.off(SOCKET_EVENTS.orderStatusChanged, onStatusChanged);
      appStateSubscription.remove();
    };
  }, [socket, queryClient, session, chime]);

  return { highlightedOrderId };
}

import { SOCKET_EVENTS, type OrderStatusChangedPayload } from "@foodiedeals/shared";
import { useSocket } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useDeviceId } from "../../../lib/useDeviceId";

export function useOrderSocket(orderId: string | undefined) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { data: deviceId } = useDeviceId();

  useEffect(() => {
    if (!orderId || !deviceId) return;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order", orderId] });

    const joinRoom = () => {
      socket.emit(SOCKET_EVENTS.joinOrderRoom, { orderId, deviceId });
      invalidate();
    };

    const onStatusChanged = (payload: OrderStatusChangedPayload) => {
      if (payload.orderId === orderId) {
        invalidate();
      }
    };

    const onAppStateChange = (state: string) => {
      if (state === "active") {
        joinRoom();
      }
    };

    joinRoom();
    socket.on("connect", joinRoom);
    socket.on(SOCKET_EVENTS.orderStatusChanged, onStatusChanged);
    const appStateSubscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(SOCKET_EVENTS.orderStatusChanged, onStatusChanged);
      appStateSubscription.remove();
    };
  }, [orderId, deviceId, socket, queryClient]);
}

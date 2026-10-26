import { orderTopic, REALTIME_EVENTS, type OrderStatusChangedPayload } from "@foodiedeals/shared";
import { useBroadcast, usePollingFallback } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useDeviceId } from "../../../lib/useDeviceId";
import { refreshCustomerActivity } from "../../home/hooks/useCustomerSummary";

const POLL_MS = 5000;

/** Keeps a live order's status fresh: pushed over realtime, polled while that isn't available. */
export function useOrderUpdates(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: deviceId } = useDeviceId();

  const refresh = useCallback(() => {
    if (!orderId) return;
    void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    refreshCustomerActivity(queryClient);
  }, [orderId, queryClient]);

  const isLive = useBroadcast(
    orderId && deviceId ? orderTopic(orderId, deviceId) : null,
    {
      [REALTIME_EVENTS.orderStatusChanged]: (payload) => {
        if ((payload as OrderStatusChangedPayload).orderId === orderId) refresh();
      },
    },
    refresh,
  );

  usePollingFallback(isLive, POLL_MS, refresh);
}

import {
  REALTIME_EVENTS,
  RESTAURANTS_TOPIC,
  type Restaurant,
  type RestaurantAvailabilityChangedPayload,
} from "@foodiedeals/shared";
import { useBroadcast, usePollingFallback } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const POLL_MS = 30000;

/** Reflects a restaurant opening or pausing without a reload. */
export function useRestaurantsRealtime() {
  const queryClient = useQueryClient();

  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: ["restaurants"] }),
    [queryClient],
  );

  const isLive = useBroadcast(RESTAURANTS_TOPIC, {
    [REALTIME_EVENTS.restaurantAvailabilityChanged]: (payload) => {
      const { restaurantId, isOpen } = payload as RestaurantAvailabilityChangedPayload;
      queryClient.setQueryData<Restaurant[]>(["restaurants"], (current) =>
        current?.map((restaurant) =>
          restaurant.id === restaurantId ? { ...restaurant, isOpen } : restaurant,
        ),
      );
    },
  });

  usePollingFallback(isLive, POLL_MS, refresh);
}

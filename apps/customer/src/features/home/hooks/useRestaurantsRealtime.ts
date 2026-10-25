import { SOCKET_EVENTS, type Restaurant, type RestaurantAvailabilityChangedPayload } from "@foodiedeals/shared";
import { useSocket } from "@foodiedeals/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useRestaurantsRealtime() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onAvailabilityChanged = (payload: RestaurantAvailabilityChangedPayload) => {
      queryClient.setQueryData<Restaurant[]>(["restaurants"], (current) =>
        current?.map((restaurant) =>
          restaurant.id === payload.restaurantId ? { ...restaurant, isOpen: payload.isOpen } : restaurant,
        ),
      );
    };

    socket.on(SOCKET_EVENTS.restaurantAvailabilityChanged, onAvailabilityChanged);
    return () => {
      socket.off(SOCKET_EVENTS.restaurantAvailabilityChanged, onAvailabilityChanged);
    };
  }, [socket, queryClient]);
}

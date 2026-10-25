import type { OrderStatus } from "@foodiedeals/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyOrderAction, type OrderAction, type RestaurantOrder } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

const ACTION_TO_STATUS: Record<OrderAction, OrderStatus> = {
  ACCEPT: "ACCEPTED",
  MARK_READY: "READY",
  PICKED_UP: "PICKED_UP",
};

export function useApplyAction() {
  const { data: session } = useRestaurantSession();
  const queryClient = useQueryClient();
  const queryKey = ["restaurant-orders", session?.restaurantId];

  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: OrderAction }) =>
      applyOrderAction(orderId, session!.demoKey, action),

    onMutate: async ({ orderId, action }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RestaurantOrder[]>(queryKey);

      queryClient.setQueryData<RestaurantOrder[]>(queryKey, (current) =>
        current?.map((order) =>
          order.id === orderId ? { ...order, status: ACTION_TO_STATUS[action] } : order,
        ),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["restaurant-stats", session?.restaurantId] });
    },
  });
}

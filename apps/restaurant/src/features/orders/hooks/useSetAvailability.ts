import type { Restaurant } from "@foodiedeals/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setAvailability } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

export function useSetAvailability() {
  const { data: session } = useRestaurantSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOpen: boolean) =>
      setAvailability(session!.restaurantId, session!.demoKey, isOpen),

    onMutate: async (isOpen) => {
      await queryClient.cancelQueries({ queryKey: ["restaurants"] });
      const previous = queryClient.getQueryData<Restaurant[]>(["restaurants"]);

      queryClient.setQueryData<Restaurant[]>(["restaurants"], (current) =>
        current?.map((restaurant) =>
          restaurant.id === session?.restaurantId ? { ...restaurant, isOpen } : restaurant,
        ),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["restaurants"], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}

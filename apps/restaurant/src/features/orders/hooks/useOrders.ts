import { useQuery } from "@tanstack/react-query";

import { listOrders } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

export function useOrders() {
  const { data: session } = useRestaurantSession();

  return useQuery({
    queryKey: ["restaurant-orders", session?.restaurantId],
    queryFn: () => listOrders(session!.restaurantId, session!.demoKey),
    enabled: Boolean(session),
  });
}

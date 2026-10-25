import { useQuery } from "@tanstack/react-query";

import { getStats } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

export function useStats() {
  const { data: session } = useRestaurantSession();

  return useQuery({
    queryKey: ["restaurant-stats", session?.restaurantId],
    queryFn: () => getStats(session!.restaurantId, session!.demoKey),
    enabled: Boolean(session),
  });
}

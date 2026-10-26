import { useQuery } from "@tanstack/react-query";

import { getStats } from "../../../lib/restaurantApi";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

/** Realtime pushes changes; this catches anything missed while a background tab's socket slept. */
const SAFETY_REFRESH_MS = 20_000;

export function useStats() {
  const { data: session } = useRestaurantSession();

  return useQuery({
    queryKey: ["restaurant-stats", session?.restaurantId],
    queryFn: () => getStats(session!.restaurantId, session!.demoKey),
    enabled: Boolean(session),
    refetchInterval: SAFETY_REFRESH_MS,
  });
}

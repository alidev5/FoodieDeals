import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readStoredValue, writeStoredValue } from "../../../lib/platformStorage";

const SESSION_KEY = "foodiedeals.restaurant-session";
const QUERY_KEY = ["restaurant-session"];

export interface RestaurantSession {
  restaurantId: string;
  demoKey: string;
}

export function useRestaurantSession() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<RestaurantSession | null> => {
      const raw = await readStoredValue(SESSION_KEY);
      return raw ? (JSON.parse(raw) as RestaurantSession) : null;
    },
  });
}

export function useSaveRestaurantSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: RestaurantSession) => {
      await writeStoredValue(SESSION_KEY, JSON.stringify(session));
      return session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(QUERY_KEY, session);
    },
  });
}

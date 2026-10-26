import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readStoredValue, writeStoredValue } from "../../../lib/secureStorage";

export const PICKUP_NAME_KEY = "foodiedeals.pickup-name";
export const PICKUP_NAME_QUERY_KEY = ["pickup-name"];

export function usePickupName() {
  return useQuery({
    queryKey: PICKUP_NAME_QUERY_KEY,
    queryFn: () => readStoredValue(PICKUP_NAME_KEY),
  });
}

export function useSavePickupName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await writeStoredValue(PICKUP_NAME_KEY, name);
      return name;
    },
    onSuccess: (name) => {
      queryClient.setQueryData(PICKUP_NAME_QUERY_KEY, name);
    },
  });
}

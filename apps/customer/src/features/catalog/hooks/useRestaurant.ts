import { useQuery } from "@tanstack/react-query";

import { catalogRepository } from "../api";

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => catalogRepository.getRestaurant(id as string),
    enabled: Boolean(id),
  });
}

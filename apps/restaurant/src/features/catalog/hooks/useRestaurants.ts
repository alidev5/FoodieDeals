import { useQuery } from "@tanstack/react-query";

import { catalogRepository } from "../api";

export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: () => catalogRepository.listRestaurants(),
  });
}

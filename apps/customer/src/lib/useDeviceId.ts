import { useQuery } from "@tanstack/react-query";

import { getOrCreateDeviceId } from "./deviceId";

export function useDeviceId() {
  return useQuery({
    queryKey: ["device-id"],
    queryFn: getOrCreateDeviceId,
    staleTime: Infinity,
  });
}

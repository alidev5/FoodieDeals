import { useQuery } from "@tanstack/react-query";

import { useDeviceId } from "../../../lib/useDeviceId";
import { getOrder } from "../api/ordersApi";

export function useOrder(orderId: string | undefined) {
  const { data: deviceId } = useDeviceId();

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId as string, deviceId as string),
    enabled: Boolean(orderId) && Boolean(deviceId),
  });
}

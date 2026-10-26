import { useQuery } from "@tanstack/react-query";

import { useDeviceId } from "../../../lib/useDeviceId";
import { getCustomerSummary, listMyOrders, type CustomerSummary } from "../api/customerApi";

/** Static savings and "Order again" content from the design, shown until a customer has orders. */
export const DEMO_CUSTOMER_SUMMARY: CustomerSummary = {
  savedThisMonthCents: 4260,
  savedLastMonthCents: 3610,
  pickupsThisMonth: 7,
  savingsThisMonthCents: [320, 560, 410, 300, 980, 690, 1000],
  recentRestaurants: [
    { restaurantId: "lotus-dumpling", lastOrderId: "", lastOrderedAt: "" },
    { restaurantId: "cedar-salt", lastOrderId: "", lastOrderedAt: "" },
  ],
};

export function useCustomerSummary() {
  const { data: deviceId } = useDeviceId();

  return useQuery({
    queryKey: ["customer-summary", deviceId],
    queryFn: () => getCustomerSummary(deviceId as string),
    enabled: Boolean(deviceId),
  });
}

export function useMyOrders() {
  const { data: deviceId } = useDeviceId();

  return useQuery({
    queryKey: ["my-orders", deviceId],
    queryFn: () => listMyOrders(deviceId as string),
    enabled: Boolean(deviceId),
  });
}

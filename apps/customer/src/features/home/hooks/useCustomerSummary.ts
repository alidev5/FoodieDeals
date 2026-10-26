import { useQuery, type QueryClient } from "@tanstack/react-query";

import { useDeviceId } from "../../../lib/useDeviceId";
import { getCustomerSummary, listMyOrders, type CustomerSummary } from "../api/customerApi";

/** While an order is still with the kitchen, the list re-checks this often even without realtime. */
const ACTIVE_ORDER_POLL_MS = 5000;

/** Refetches everything derived from the customer's orders: the list, tab badge and savings. */
export function refreshCustomerActivity(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["customer-summary"] });
}

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
    refetchInterval: (query) =>
      query.state.data?.some((order) => order.status !== "PICKED_UP")
        ? ACTIVE_ORDER_POLL_MS
        : false,
  });
}

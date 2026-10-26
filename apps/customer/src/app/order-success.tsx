import { useLocalSearchParams } from "expo-router";

import { OrderSuccessScreen } from "../features/checkout/screens/OrderSuccessScreen";

export default function OrderSuccess() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <OrderSuccessScreen orderId={orderId} />;
}

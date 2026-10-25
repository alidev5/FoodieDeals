import { useLocalSearchParams } from "expo-router";

import { PickupScreen } from "../features/pickup/screens/PickupScreen";

export default function Pickup() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <PickupScreen orderId={orderId} />;
}

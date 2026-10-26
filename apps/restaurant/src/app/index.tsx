import { Redirect } from "expo-router";

import { useRestaurantSession } from "../features/auth/hooks/useRestaurantAuth";
import { RestaurantSelectScreen } from "../features/auth/screens/RestaurantSelectScreen";

export default function Index() {
  const { data: session, isLoading } = useRestaurantSession();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <RestaurantSelectScreen />;
  }

  return <Redirect href="/orders" />;
}

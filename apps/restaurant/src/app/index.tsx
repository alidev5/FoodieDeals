import { useTheme } from "@foodiedeals/ui-native";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useRestaurantSession } from "../features/auth/hooks/useRestaurantAuth";
import { RestaurantSelectScreen } from "../features/auth/screens/RestaurantSelectScreen";

export default function Index() {
  const theme = useTheme();
  const { data: session, isLoading } = useRestaurantSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.accent} />
      </View>
    );
  }

  if (!session) {
    return <RestaurantSelectScreen />;
  }

  return <Redirect href="/orders" />;
}

import { useTheme } from "@foodiedeals/ui-native";
import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDashboardLayout } from "../../../lib/useDashboardLayout";
import { useRestaurantSession } from "../../auth/hooks/useRestaurantAuth";
import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { useStats } from "../../orders/hooks/useStats";

import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: PropsWithChildren) {
  const theme = useTheme();
  const { isRail, canExpand } = useDashboardLayout();
  const { data: session, isLoading: isSessionLoading } = useRestaurantSession();
  const { data: restaurants } = useRestaurants();
  const { data: stats } = useStats();
  const restaurant = restaurants?.find((candidate) => candidate.id === session?.restaurantId);
  const street = restaurant?.address?.split(",")[0]?.trim() ?? null;

  // Dashboard pages opened by URL without a session go back to restaurant sign-in.
  if (!isSessionLoading && !session) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.surfaceDark }}
      edges={["top", "left", "bottom"]}
    >
      <View style={{ flex: 1, flexDirection: "row", minHeight: 0 }}>
        <Sidebar
          restaurantName={restaurant?.name ?? "Restaurant"}
          restaurantStreet={street}
          stats={stats}
          isRail={isRail}
          canExpand={canExpand}
        />
        <View
          style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: theme.color.background }}
        >
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

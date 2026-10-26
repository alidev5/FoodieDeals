import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  BootSplash,
  SocketProvider,
  ThemeProvider,
  useMinimumDelay,
  useTheme,
} from "@foodiedeals/ui-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRestaurantSession } from "../features/auth/hooks/useRestaurantAuth";
import { OrderAlertsProvider } from "../features/orders/OrderAlertsProvider";
import { API_URL } from "../lib/apiUrl";
import { queryClient } from "../lib/queryClient";

// The dashboard is information-dense, so it renders a step smaller than the phone app.
const DASHBOARD_DENSITY = 0.86;

function AppShell() {
  const theme = useTheme();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const { isLoading: isSessionLoading } = useRestaurantSession();
  const splashShownLongEnough = useMinimumDelay(1200);
  const isReady = fontsLoaded && !isSessionLoading && splashShownLongEnough;

  return (
    <>
      <StatusBar style={isReady ? "dark" : "light"} />
      <OrderAlertsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: theme.color.background },
          }}
        />
      </OrderAlertsProvider>
      {isReady ? null : (
        <View style={StyleSheet.absoluteFill}>
          <BootSplash tagline="Restaurant dashboard" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider url={API_URL}>
          <ThemeProvider density={DASHBOARD_DENSITY}>
            <AppShell />
          </ThemeProvider>
        </SocketProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SocketProvider, ThemeProvider, useTheme } from "@foodiedeals/ui-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StartNewOrderSheet } from "../features/cart/components/StartNewOrderSheet";
import { API_URL } from "../lib/apiUrl";
import { queryClient } from "../lib/queryClient";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function AppShell() {
  const theme = useTheme();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: theme.color.background }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.background } }} />
      <StartNewOrderSheet />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.foodiedeals">
        <QueryClientProvider client={queryClient}>
          <SocketProvider url={API_URL}>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </SocketProvider>
        </QueryClientProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}

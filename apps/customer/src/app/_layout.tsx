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
  RealtimeProvider,
  ThemeProvider,
  useMinimumDelay,
  useTheme,
} from "@foodiedeals/ui-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRootNavigationState, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StartNewOrderSheet } from "../features/cart/components/StartNewOrderSheet";
import { TabBar } from "../features/home/components/TabBar";
import { usePickupName } from "../features/onboarding/hooks/usePickupName";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../lib/apiUrl";
import { queryClient } from "../lib/queryClient";
import { StripeProvider } from "../lib/StripeProvider";

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

  const { data: pickupName, isLoading: isSessionLoading } = usePickupName();
  const splashShownLongEnough = useMinimumDelay(1400);
  const router = useRouter();
  const pathname = usePathname();
  const isNavigationReady = Boolean(useRootNavigationState()?.key);
  const isReady = fontsLoaded && !isSessionLoading && splashShownLongEnough;

  // Every screen past onboarding needs a pickup name, including ones opened by direct URL.
  useEffect(() => {
    if (isNavigationReady && !isSessionLoading && !pickupName && pathname !== "/") {
      router.replace("/");
    }
  }, [isNavigationReady, isSessionLoading, pickupName, pathname, router]);

  return (
    <>
      <StatusBar style={isReady ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: theme.color.background },
        }}
      />
      {isReady && pickupName ? <TabBar /> : null}
      <StartNewOrderSheet />
      {isReady ? null : (
        <View style={StyleSheet.absoluteFill}>
          <BootSplash tagline="Pickup deals from restaurants around you" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.foodiedeals"
      >
        <QueryClientProvider client={queryClient}>
          <RealtimeProvider url={SUPABASE_URL} apiKey={SUPABASE_ANON_KEY}>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </RealtimeProvider>
        </QueryClientProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}

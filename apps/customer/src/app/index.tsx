import { useTheme } from "@foodiedeals/ui-native";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { usePickupName } from "../features/onboarding/hooks/usePickupName";
import { OnboardingScreen } from "../features/onboarding/screens/OnboardingScreen";

export default function Index() {
  const theme = useTheme();
  const { data: pickupName, isLoading } = usePickupName();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.accent} />
      </View>
    );
  }

  if (!pickupName) {
    return <OnboardingScreen />;
  }

  return <Redirect href="/home" />;
}

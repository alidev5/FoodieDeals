import { Redirect } from "expo-router";

import { usePickupName } from "../features/onboarding/hooks/usePickupName";
import { OnboardingScreen } from "../features/onboarding/screens/OnboardingScreen";

export default function Index() {
  const { data: pickupName } = usePickupName();

  if (!pickupName) {
    return <OnboardingScreen />;
  }

  return <Redirect href="/home" />;
}

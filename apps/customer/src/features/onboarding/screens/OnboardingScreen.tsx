import { Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSavePickupName } from "../hooks/usePickupName";

export function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const savePickupName = useSavePickupName();

  const canContinue = name.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    await savePickupName.mutateAsync(name.trim());
    router.replace("/home");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ flex: 1, justifyContent: "center", padding: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display">FoodieDeals</Text>
          <Text variant="body" color="secondary">
            Deals from restaurants nearby. Order ahead, skip the line, pay no delivery fee.
          </Text>
        </View>

        <Card variant="dark" padding="lg" style={{ gap: theme.spacing.md }}>
          <Text variant="heading" color="onDark">
            What's your pickup name?
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Hamza M."
            placeholderTextColor={theme.color.textTertiary}
            autoCapitalize="words"
            style={{
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              fontSize: theme.type.scale.body.fontSize,
              color: theme.color.text,
            }}
          />
          <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
            We'll call this out at the counter when your order is ready.
          </Text>
        </Card>

        <Button label="Continue" variant="accent" disabled={!canContinue} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

import type { Restaurant } from "@foodiedeals/shared";
import { Badge, Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { useSaveRestaurantSession } from "../hooks/useRestaurantAuth";

export function RestaurantSelectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: restaurants, isLoading } = useRestaurants();
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [demoKey, setDemoKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saveSession = useSaveRestaurantSession();

  const handleContinue = async () => {
    if (!selected) return;
    if (demoKey.trim() !== selected.demoKey) {
      setError("That demo key doesn't match this restaurant.");
      return;
    }
    setError(null);
    await saveSession.mutateAsync({ restaurantId: selected.id, demoKey: demoKey.trim() });
    router.replace("/orders");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text variant="display">FoodieDeals for restaurants</Text>
        <Text variant="body" color="secondary">
          Choose your restaurant and enter its demo key to continue.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={theme.color.accent} />
        ) : (
          <ScrollView contentContainerStyle={{ gap: theme.spacing.sm }}>
            {(restaurants ?? []).map((restaurant) => {
              const isSelected = selected?.id === restaurant.id;
              return (
                <Card
                  key={restaurant.id}
                  variant={isSelected ? "outline" : "light"}
                  padding="md"
                >
                  <Button
                    label={restaurant.name}
                    variant={isSelected ? "dark" : "outline"}
                    onPress={() => {
                      setSelected(restaurant);
                      setError(null);
                    }}
                  />
                </Card>
              );
            })}
          </ScrollView>
        )}

        {selected ? (
          <Card variant="dark" padding="lg" style={{ gap: theme.spacing.md }}>
            <Text variant="heading" color="onDark">
              Demo key for {selected.name}
            </Text>
            <TextInput
              value={demoKey}
              onChangeText={setDemoKey}
              placeholder="e.g. MISO-0001"
              placeholderTextColor={theme.color.textTertiary}
              autoCapitalize="characters"
              style={{
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                color: theme.color.text,
              }}
            />
            {error ? <Badge label={error} /> : null}
            <Button label="Continue" variant="accent" onPress={handleContinue} />
          </Card>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

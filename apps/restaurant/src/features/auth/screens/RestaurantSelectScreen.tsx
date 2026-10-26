import type { Restaurant } from "@foodiedeals/shared";
import {
  BrandMark,
  Button,
  Icon,
  InlineAlert,
  LoadingState,
  resolveFoodPhoto,
  StatusDot,
  Text,
  useTheme,
  type IconName,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { useSaveRestaurantSession } from "../hooks/useRestaurantAuth";

const FEATURES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "bell",
    title: "Paid orders, live",
    body: "New orders land with a chime the second the customer pays.",
  },
  {
    icon: "tag",
    title: "Deals that bring people in",
    body: "The best deal applies automatically, so customers always win.",
  },
  {
    icon: "mc:wallet-outline",
    title: "Payouts you can see",
    body: "Every order shows your share and when it was paid out.",
  },
];

const SIDE_PANEL_MIN_WIDTH = 960;

function BrandPanel() {
  const theme = useTheme();
  const photos = ["miso-ramen.png", "dumpling-plate.png", "margherita-pizza.png"].map((name) =>
    resolveFoodPhoto(name),
  );

  return (
    <View
      style={{
        width: "42%",
        maxWidth: 560,
        backgroundColor: theme.color.surfaceDark,
        padding: theme.spacing.xxxl,
        justifyContent: "space-between",
        gap: theme.spacing.xxl,
      }}
    >
      <BrandMark size={44} tone="dark" withWordmark subtitle="for restaurants" />

      <View style={{ gap: theme.spacing.xl }}>
        <Text variant="display" color="onDark" style={{ fontSize: 40, lineHeight: 46 }}>
          Run pickup orders{"\n"}
          <Text variant="display" style={{ color: theme.color.gold, fontSize: 40, lineHeight: 46 }}>
            without the chaos.
          </Text>
        </Text>
        <View style={{ gap: theme.spacing.lg }}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.color.surfaceDarkRaised,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={feature.icon} size={18} color={theme.color.gold} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" color="onDark">
                  {feature.title}
                </Text>
                <Text variant="caption" color="onDark" style={{ opacity: 0.6 }}>
                  {feature.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.sm, height: 120 }}>
        {photos.map((photo, index) => (
          <View key={index} style={{ flex: 1, borderRadius: theme.radius.lg, overflow: "hidden" }}>
            <Image source={photo} style={{ flex: 1 }} contentFit="cover" />
          </View>
        ))}
      </View>
    </View>
  );
}

function RestaurantOption({
  restaurant,
  selected,
  onPress,
}: {
  restaurant: Restaurant;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const photo = resolveFoodPhoto(restaurant.heroPhoto);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={restaurant.name}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        borderWidth: 1.5,
        borderColor: selected ? theme.color.surfaceDark : theme.color.line,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.sm,
          overflow: "hidden",
          backgroundColor: theme.color.surfaceMuted,
        }}
      >
        {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
          <StatusDot tone={restaurant.isOpen ? "success" : "accent"} />
          <Text variant="caption" color="tertiary" numberOfLines={1}>
            {restaurant.isOpen ? "Open" : "Paused"} · {restaurant.cuisine}
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: theme.color.surfaceMuted,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
        }}
      >
        <Text variant="label" color="secondary">
          {restaurant.demoKey}
        </Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: selected ? 0 : 1.5,
          borderColor: theme.color.line,
          backgroundColor: selected ? theme.color.surfaceDark : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? <Icon name="check" size={13} color={theme.color.textOnDark} /> : null}
      </View>
    </Pressable>
  );
}

export function RestaurantSelectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: restaurants, isLoading, isError, refetch } = useRestaurants();
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [demoKey, setDemoKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saveSession = useSaveRestaurantSession();

  const handleSelect = (restaurant: Restaurant) => {
    setSelected(restaurant);
    setDemoKey("");
    setError(null);
  };

  const handleContinue = async () => {
    if (!selected) return;
    if (demoKey.trim().toUpperCase() !== selected.demoKey) {
      setError(`That key doesn't match ${selected.name}. Its demo key is ${selected.demoKey}.`);
      return;
    }
    setError(null);
    await saveSession.mutateAsync({ restaurantId: selected.id, demoKey: selected.demoKey });
    router.replace("/orders");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {width >= SIDE_PANEL_MIN_WIDTH ? <BrandPanel /> : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: theme.spacing.xxxl,
          }}
        >
          <View
            style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: theme.spacing.xl }}
          >
            {width < SIDE_PANEL_MIN_WIDTH ? (
              <BrandMark size={40} withWordmark subtitle="for restaurants" />
            ) : null}

            <View style={{ gap: theme.spacing.xs }}>
              <Text variant="title" style={{ fontSize: 30, lineHeight: 36 }}>
                Sign in to your kitchen
              </Text>
              <Text variant="body" color="secondary">
                Choose a demo restaurant. Each one has its own key, shown beside its name.
              </Text>
            </View>

            {isLoading ? (
              <LoadingState message="Loading restaurants" style={{ flex: 0 }} />
            ) : isError ? (
              <InlineAlert
                title="Can't reach the FoodieDeals API"
                message="Make sure the API is running, then try again."
                action={<Button label="Retry" variant="dark" onPress={() => refetch()} />}
              />
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {(restaurants ?? []).map((restaurant) => (
                  <RestaurantOption
                    key={restaurant.id}
                    restaurant={restaurant}
                    selected={selected?.id === restaurant.id}
                    onPress={() => handleSelect(restaurant)}
                  />
                ))}
              </View>
            )}

            {selected ? (
              <View
                style={{
                  backgroundColor: theme.color.surface,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xl,
                  gap: theme.spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text variant="heading">Demo key</Text>
                  <Pressable
                    onPress={() => {
                      setDemoKey(selected.demoKey);
                      setError(null);
                    }}
                    accessibilityRole="button"
                    style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}
                  >
                    <Icon name="key" size={14} color={theme.color.accent} />
                    <Text variant="bodyStrong" color="accent">
                      Fill {selected.demoKey}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={demoKey}
                  onChangeText={(value) => {
                    setDemoKey(value);
                    setError(null);
                  }}
                  onSubmitEditing={handleContinue}
                  placeholder={`e.g. ${selected.demoKey}`}
                  placeholderTextColor={theme.color.textTertiary}
                  autoCapitalize="characters"
                  accessibilityLabel="Demo key"
                  style={{
                    backgroundColor: theme.color.surfaceMuted,
                    borderRadius: theme.radius.md,
                    borderWidth: 1.5,
                    borderColor: error ? theme.color.accent : "transparent",
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md + 2,
                    fontSize: 16,
                    letterSpacing: 1,
                    color: theme.color.text,
                  }}
                />
                {error ? <InlineAlert title="Wrong key" message={error} /> : null}
                <Button
                  label={saveSession.isPending ? "Signing in…" : `Open ${selected.name}`}
                  variant="accent"
                  size="lg"
                  trailingIcon="arrow-right"
                  disabled={!demoKey.trim() || saveSession.isPending}
                  onPress={handleContinue}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

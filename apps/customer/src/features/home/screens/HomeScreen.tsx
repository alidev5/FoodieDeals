import type { Restaurant } from "@foodiedeals/shared";
import { Text, useTheme } from "@foodiedeals/ui-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRestaurants } from "../../catalog/hooks";
import { usePickupName } from "../../onboarding/hooks/usePickupName";
import { FilterChips, type HomeFilter } from "../components/FilterChips";
import { RestaurantCard } from "../components/RestaurantCard";
import { SavingsBanner } from "../components/SavingsBanner";
import { useRestaurantsRealtime } from "../hooks/useRestaurantsRealtime";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function matchesFilter(restaurant: Restaurant, filter: HomeFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "OPEN") return restaurant.isOpen;
  return restaurant.deals.some((deal) => deal.type === filter);
}

function matchesSearch(restaurant: Restaurant, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = `${restaurant.name} ${restaurant.cuisine}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: restaurants, isLoading } = useRestaurants();
  const { data: pickupName } = usePickupName();
  const [filter, setFilter] = useState<HomeFilter>("ALL");
  const [search, setSearch] = useState("");
  useRestaurantsRealtime();

  const filtered = useMemo(
    () =>
      (restaurants ?? []).filter(
        (restaurant) => matchesFilter(restaurant, filter) && matchesSearch(restaurant, search),
      ),
    [restaurants, filter, search],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, gap: theme.spacing.lg, flex: 1 }}>
        <View style={{ gap: theme.spacing.xs }}>
          {pickupName ? (
            <Text variant="caption" color="secondary">
              {greeting()}, {pickupName.split(" ")[0]}
            </Text>
          ) : null}
          <Text variant="display">Nearby deals</Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dumplings, ramen, pizza…"
          placeholderTextColor={theme.color.textTertiary}
          style={{
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: theme.color.line,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            color: theme.color.text,
          }}
        />

        {restaurants ? <SavingsBanner restaurants={restaurants} /> : null}

        <FilterChips selected={filter} onSelect={setFilter} />

        {isLoading ? (
          <ActivityIndicator color={theme.color.accent} />
        ) : (
          <FlashList
            data={filtered}
            keyExtractor={(item) => item.id}
            estimatedItemSize={220}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
            renderItem={({ item }) => (
              <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

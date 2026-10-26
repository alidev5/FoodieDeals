import { DEMO_PICKUP_AREA, restaurantDisplayExtras, type Restaurant } from "@foodiedeals/shared";
import { Icon, IconButton, Text, TextField, useTheme } from "@foodiedeals/ui-native";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, View, type TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initials } from "../../../lib/display";
import { useRestaurants } from "../../catalog/hooks";
import { usePickupName } from "../../onboarding/hooks/usePickupName";
import { FilterChips, type HomeFilter } from "../components/FilterChips";
import { OrderAgainRow } from "../components/OrderAgainRow";
import { RestaurantCard } from "../components/RestaurantCard";
import { SavingsBanner } from "../components/SavingsBanner";
import { TAB_BAR_CLEARANCE } from "../components/TabBar";
import { DEMO_CUSTOMER_SUMMARY, useCustomerSummary } from "../hooks/useCustomerSummary";
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
  const menuNames = restaurant.menu.map((item) => item.name).join(" ");
  const haystack = `${restaurant.name} ${restaurant.cuisine} ${menuNames}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function SectionHeader({
  title,
  linkLabel,
  onLinkPress,
}: {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text variant="title">{title}</Text>
      {linkLabel ? (
        <Pressable
          onPress={onLinkPress}
          style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
        >
          <Text variant="bodyStrong" color="accent">
            {linkLabel}
          </Text>
          <Icon name="chevron-right" size={16} color={theme.color.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { data: restaurants, isLoading } = useRestaurants();
  const { data: pickupName } = usePickupName();
  const { data: realSummary } = useCustomerSummary();
  // New customers see the demo numbers until they have pickups of their own.
  const summary =
    realSummary && realSummary.recentRestaurants.length > 0 ? realSummary : DEMO_CUSTOMER_SUMMARY;
  const [filter, setFilter] = useState<HomeFilter>("ALL");
  const [search, setSearch] = useState("");
  useRestaurantsRealtime();

  const filtered = useMemo(
    () =>
      (restaurants ?? [])
        .filter(
          (restaurant) => matchesFilter(restaurant, filter) && matchesSearch(restaurant, search),
        )
        .sort(
          (a, b) =>
            Number(b.isOpen) - Number(a.isOpen) ||
            restaurantDisplayExtras(a.id).distanceMiles -
              restaurantDisplayExtras(b.id).distanceMiles,
        ),
    [restaurants, filter, search],
  );

  const recentRestaurants = useMemo(() => {
    const byId = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant]));
    return (summary?.recentRestaurants ?? [])
      .map((recent) => byId.get(recent.restaurantId))
      .filter((restaurant): restaurant is Restaurant => Boolean(restaurant));
  }, [restaurants, summary]);

  const firstName = pickupName?.split(" ")[0];

  const header = (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" color="tertiary">
            Pickup near you
          </Text>
          <Pressable
            onPress={() => router.replace("/map")}
            style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}
          >
            <Icon name="mc:map-marker-outline" size={18} color={theme.color.accent} />
            <Text variant="heading">{DEMO_PICKUP_AREA}</Text>
            <Icon name="chevron-down" size={18} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <IconButton
            icon="bell"
            hasDot={recentRestaurants.length > 0}
            accessibilityLabel="Order updates"
            onPress={() => router.replace("/orders")}
          />
          <Pressable
            onPress={() => router.replace("/profile")}
            accessibilityLabel="Profile"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.color.surfaceDark,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text variant="label" style={{ color: theme.color.gold, fontSize: 14 }}>
              {pickupName ? initials(pickupName, 2) : "?"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        {firstName ? (
          <Text variant="body" color="secondary">
            {greeting()}, {firstName}
          </Text>
        ) : null}
        <View>
          <Text variant="display">Great food,</Text>
          <Text variant="display" color="accent">
            better deals.
          </Text>
        </View>
      </View>

      <TextField
        ref={searchRef}
        value={search}
        onChangeText={setSearch}
        placeholder="Search dumplings, ramen, pizza…"
        accessibilityLabel="Search restaurants and dishes"
        returnKeyType="search"
        icon="search"
        size="lg"
        style={{ borderRadius: theme.radius.xl }}
        trailing={
          search ? (
            <IconButton
              icon="x"
              size={40}
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
            />
          ) : (
            <IconButton
              icon="sliders"
              variant="dark"
              size={40}
              accessibilityLabel="Search"
              onPress={() => searchRef.current?.focus()}
            />
          )
        }
      />

      <SavingsBanner summary={summary} />

      {recentRestaurants.length > 0 ? (
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader
            title="Order again"
            linkLabel="History"
            onLinkPress={() => router.replace("/orders")}
          />
          <OrderAgainRow
            restaurants={recentRestaurants}
            onSelect={(restaurant) => router.push(`/restaurant/${restaurant.id}`)}
          />
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title="Deals near you"
          linkLabel="View map"
          onLinkPress={() => router.replace("/map")}
        />
        <FilterChips selected={filter} onSelect={setFilter} allCount={restaurants?.length ?? 0} />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      edges={["top", "left", "right"]}
    >
      {/* A plain ScrollView, not a recycling list: the search field in the header must not be
          remounted (and lose focus) when the keyboard changes the screen size. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          paddingBottom: TAB_BAR_CLEARANCE,
          gap: theme.spacing.lg,
        }}
      >
        {header}
        {isLoading ? (
          <ActivityIndicator color={theme.color.accent} />
        ) : filtered.length === 0 ? (
          <Text
            variant="body"
            color="secondary"
            style={{ textAlign: "center", marginTop: theme.spacing.xl }}
          >
            No restaurants match that yet.
          </Text>
        ) : (
          filtered.map((item) => (
            <RestaurantCard
              key={item.id}
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

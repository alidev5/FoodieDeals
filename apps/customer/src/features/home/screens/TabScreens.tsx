import type { Restaurant } from "@foodiedeals/shared";
import { DEMO_PICKUP_AREA, formatCents, restaurantDisplayExtras } from "@foodiedeals/shared";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  InlineAlert,
  Text,
  TextField,
  useTheme,
  type IconName,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initials, streetAddress } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { useRestaurants } from "../../catalog/hooks";
import { useFavoritesStore } from "../../favorites/favoritesStore";
import { useSignOut } from "../../onboarding/hooks/useCustomerSession";
import { usePickupName, useSavePickupName } from "../../onboarding/hooks/usePickupName";
import { RestaurantCard } from "../components/RestaurantCard";
import { TAB_BAR_CLEARANCE } from "../components/TabBar";
import { useCustomerSummary, useMyOrders } from "../hooks/useCustomerSummary";

function TabScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      edges={["top", "left", "right"]}
    >
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, gap: 2 }}>
        <Text variant="display">{title}</Text>
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      </View>
      {children}
    </SafeAreaView>
  );
}

export function MapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: restaurants } = useRestaurants();
  const sorted = [...(restaurants ?? [])].sort(
    (a, b) =>
      restaurantDisplayExtras(a.id).distanceMiles - restaurantDisplayExtras(b.id).distanceMiles,
  );

  const openDirections = (restaurant: Restaurant) =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address ?? restaurant.name)}`,
    );

  return (
    <TabScreen title="Nearby" subtitle={`Pickup spots around ${DEMO_PICKUP_AREA}, closest first`}>
      <FlatList
        data={sorted}
        keyExtractor={(restaurant) => restaurant.id}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
        renderItem={({ item: restaurant }) => {
          const extras = restaurantDisplayExtras(restaurant.id);
          const photo = resolveFoodPhoto(restaurant.heroPhoto);
          return (
            <Pressable
              onPress={() => restaurant.isOpen && router.push(`/restaurant/${restaurant.id}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.xl,
                padding: theme.spacing.md,
                opacity: restaurant.isOpen ? 1 : 0.6,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.radius.md,
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
                <Text variant="caption" color="tertiary" numberOfLines={1}>
                  {streetAddress(restaurant.address)} · {extras.distanceMiles} mi ·{" "}
                  {extras.walkMinutes} min walk
                </Text>
              </View>
              <Pressable
                onPress={() => openDirections(restaurant)}
                accessibilityLabel={`Directions to ${restaurant.name}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.color.surfaceDark,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="navigation" size={16} color={theme.color.textOnDark} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </TabScreen>
  );
}

export function FavoritesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: restaurants } = useRestaurants();
  const favoriteIds = useFavoritesStore((state) => state.restaurantIds);
  const favorites = (restaurants ?? []).filter((restaurant) => favoriteIds.includes(restaurant.id));

  return (
    <TabScreen title="Saved" subtitle="Restaurants you've hearted">
      <FlatList
        data={favorites}
        keyExtractor={(restaurant) => restaurant.id}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.lg,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title="No saved restaurants yet"
            body="Tap the heart on any restaurant and it will be waiting for you here."
            action={
              <Button
                label="Find restaurants"
                icon="compass"
                variant="dark"
                onPress={() => router.replace("/home")}
              />
            }
          />
        }
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
        )}
      />
    </TabScreen>
  );
}

function ProfileRow({
  icon,
  label,
  detail,
  onPress,
  tone = "default",
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress: () => void;
  tone?: "default" | "danger";
}) {
  const theme = useTheme();
  const color = tone === "danger" ? theme.color.accent : theme.color.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: theme.radius.sm,
          backgroundColor: tone === "danger" ? theme.color.accentSoft : theme.color.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ color }}>
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" color="tertiary">
            {detail}
          </Text>
        ) : null}
      </View>
      {tone === "danger" ? null : (
        <Icon name="chevron-right" size={18} color={theme.color.textTertiary} />
      )}
    </Pressable>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.surfaceDarkRaised,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: 2,
      }}
    >
      <Text variant="heading" color="onDark">
        {value}
      </Text>
      <Text variant="caption" color="onDark" style={{ opacity: 0.6 }}>
        {label}
      </Text>
    </View>
  );
}

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: pickupName } = usePickupName();
  const { data: orders } = useMyOrders();
  const { data: summary } = useCustomerSummary();
  const savePickupName = useSavePickupName();
  const signOut = useSignOut();
  const [draft, setDraft] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const value = draft ?? pickupName ?? "";
  const canSave = draft !== null && draft.trim().length > 0 && draft.trim() !== pickupName;
  const totalSavedCents = (orders ?? []).reduce((sum, order) => sum + order.discountCents, 0);
  const favoriteCount = useFavoritesStore((state) => state.restaurantIds.length);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    router.replace("/");
  };

  return (
    <TabScreen title="Profile" subtitle="Your pickup identity and activity">
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.lg,
          paddingBottom: TAB_BAR_CLEARANCE,
        }}
      >
        <Card variant="dark" style={{ gap: theme.spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.color.gold,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="title">{pickupName ? initials(pickupName, 2) : "?"}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="title" color="onDark">
                {pickupName || "Guest"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                <Icon name="map-pin" size={12} color={theme.color.gold} />
                <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
                  Picking up in {DEMO_PICKUP_AREA}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <ProfileStat value={String(orders?.length ?? 0)} label="Pickups" />
            <ProfileStat value={formatCents(totalSavedCents)} label="Saved overall" />
            <ProfileStat
              value={formatCents(summary?.savedThisMonthCents ?? 0)}
              label="This month"
            />
          </View>
        </Card>

        <Card style={{ gap: theme.spacing.md }}>
          <Text variant="heading">Pickup name</Text>
          <Text variant="caption" color="tertiary" style={{ marginTop: -6 }}>
            Used on new orders. Say it at the counter to collect.
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, alignItems: "center" }}>
            <TextField
              value={value}
              onChangeText={setDraft}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Hamza M."
              accessibilityLabel="Pickup name"
              icon="user"
              tone="muted"
              style={{ flex: 1 }}
            />
            <Button
              label="Save"
              variant="dark"
              disabled={!canSave}
              onPress={async () => {
                await savePickupName.mutateAsync(value.trim());
                setDraft(null);
              }}
            />
          </View>
        </Card>

        <Card padding="lg" style={{ paddingVertical: theme.spacing.sm }}>
          <ProfileRow
            icon="mc:receipt"
            label="Order history"
            detail={`${orders?.length ?? 0} pickups`}
            onPress={() => router.replace("/orders")}
          />
          <ProfileRow
            icon="heart"
            label="Saved restaurants"
            detail={`${favoriteCount} saved`}
            onPress={() => router.replace("/favorites")}
          />
          <ProfileRow
            icon="credit-card"
            label="Payments"
            detail="Cards are entered securely with Stripe at checkout"
            onPress={() => setShowHowItWorks(true)}
          />
          <ProfileRow
            icon="help-circle"
            label="How pickup works"
            onPress={() => setShowHowItWorks((current) => !current)}
          />
          {showHowItWorks ? (
            <InlineAlert
              tone="info"
              title="Order, pay, walk in"
              message="The best deal is applied automatically and you pay in the app. Your order goes straight to the kitchen and this app updates live until it is ready. Say your pickup name at the counter."
            />
          ) : null}
        </Card>

        <Card padding="lg" style={{ paddingVertical: theme.spacing.sm }}>
          <ProfileRow
            icon="log-out"
            label="Sign out"
            detail="Switch to another pickup name or demo account"
            tone="danger"
            onPress={handleSignOut}
          />
        </Card>
      </ScrollView>
    </TabScreen>
  );
}

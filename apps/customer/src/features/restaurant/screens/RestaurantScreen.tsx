import {
  formatRatingCountLong,
  MENU_ITEM_DISPLAY_EXTRAS,
  menuItemDisplayExtras,
  restaurantDisplayExtras,
  type MenuItem,
} from "@foodiedeals/shared";
import {
  Icon,
  IconButton,
  Text,
  TextField,
  useTheme,
  type IconName,
  type TextFieldRef,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  formatMinuteOfDay,
  initials,
  menuItemDealTag,
  prepRange,
  priceLevelLabel,
  streetAddress,
} from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import {
  useCartItemCount,
  useCartLines,
  useCartStore,
  useCartSubtotalCents,
} from "../../cart/store";
import { useRestaurant } from "../../catalog/hooks";
import { useQuote } from "../../checkout/hooks/useQuote";
import { useFavoritesStore, useIsFavorite } from "../../favorites/favoritesStore";
import { TAB_BAR_CLEARANCE } from "../../home/components/TabBar";
import { CartBar } from "../components/CartBar";
import { DealCards } from "../components/DealCards";
import { MenuItemCard } from "../components/MenuItemCard";
import { useDealEvaluations } from "../hooks/useDealEvaluations";

function InfoColumn({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
        <Icon
          name={icon}
          size={16}
          color={icon === "mc:star" ? theme.color.gold : theme.color.accent}
        />
        <Text variant="bodyStrong">{title}</Text>
      </View>
      <Text variant="caption" color="tertiary" numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

const MENU_ORDER = Object.keys(MENU_ITEM_DISPLAY_EXTRAS);

function itemsInCategory(menu: MenuItem[], category: string): MenuItem[] {
  const matching =
    category === "Popular"
      ? menu.filter((item) => menuItemDisplayExtras(item.id).mostOrdered)
      : menu.filter((item) => menuItemDisplayExtras(item.id).category === category);
  return matching.sort((a, b) => MENU_ORDER.indexOf(a.id) - MENU_ORDER.indexOf(b.id));
}

export function RestaurantScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: restaurant, isLoading } = useRestaurant(id);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const cartRestaurantId = useCartStore((state) => state.cart.restaurantId);
  const lines = useCartLines();
  const evaluations = useDealEvaluations(restaurant);
  const itemCount = useCartItemCount();
  const subtotalCents = useCartSubtotalCents();
  const quote = useQuote();
  const isFavorite = useIsFavorite(id ?? "");
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const [category, setCategory] = useState("Popular");
  const [search, setSearch] = useState<string | null>(null);
  const searchRef = useRef<TextFieldRef>(null);
  const isSearchOpen = search !== null;

  // Focus once the field is laid out; autoFocus on mount can fire too early on Android and the
  // keyboard then closes again straight away.
  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isSearchOpen]);

  const extras = restaurantDisplayExtras(id ?? "");
  const categories = useMemo(
    () =>
      restaurant
        ? extras.menuCategories.filter(
            (candidate) => itemsInCategory(restaurant.menu, candidate).length > 0,
          )
        : [],
    [restaurant, extras],
  );

  if (isLoading || !restaurant) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.color.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.color.accent} />
      </SafeAreaView>
    );
  }

  const heroPhoto = resolveFoodPhoto(restaurant.heroPhoto);
  const isThisCart = cartRestaurantId === restaurant.id;
  const quantityOf = (menuItemId: string) =>
    isThisCart ? (lines.find((line) => line.menuItem.id === menuItemId)?.quantity ?? 0) : 0;

  const bestEvaluation = [...evaluations]
    .filter((evaluation) => evaluation.discountCents > 0)
    .sort((a, b) => b.discountCents - a.discountCents)[0];
  const bestDealId = bestEvaluation?.dealId ?? restaurant.deals[0]?.id ?? null;
  const prep = prepRange(restaurant);
  const meta = [
    restaurant.cuisine,
    priceLevelLabel(restaurant.priceLevel),
    restaurant.isOpen
      ? restaurant.closesAtMinute !== undefined
        ? `Open until ${formatMinuteOfDay(restaurant.closesAtMinute)}`
        : "Open now"
      : "Paused",
  ].filter(Boolean);
  const showCartBar = isThisCart && itemCount > 0;

  const activeCategory = categories.includes(category) ? category : (categories[0] ?? "Popular");
  const query = search?.trim().toLowerCase() ?? "";
  const visibleItems = query
    ? restaurant.menu.filter((item) =>
        `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query),
      )
    : itemsInCategory(restaurant.menu, activeCategory);

  const share = () =>
    Share.share({
      message: `${restaurant.name} on FoodieDeals: ${restaurant.deals[0]?.name ?? ""}`,
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surface }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: showCartBar ? TAB_BAR_CLEARANCE + 110 : TAB_BAR_CLEARANCE,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: 300 + insets.top, backgroundColor: theme.color.surfaceDark }}>
          {heroPhoto ? <Image source={heroPhoto} style={{ flex: 1 }} contentFit="cover" /> : null}
          <View
            style={{
              position: "absolute",
              top: insets.top + theme.spacing.sm,
              left: theme.spacing.xl,
              right: theme.spacing.xl,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <IconButton
              icon="chevron-left"
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <IconButton
                icon="search"
                accessibilityLabel="Search the menu"
                onPress={() => setSearch((current) => (current === null ? "" : null))}
              />
              <IconButton icon="share" accessibilityLabel="Share" onPress={share} />
              <IconButton
                icon={isFavorite ? "mc:heart" : "heart"}
                accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onPress={() => toggleFavorite(restaurant.id)}
              />
            </View>
          </View>
          <View
            style={{
              position: "absolute",
              right: theme.spacing.xl,
              bottom: theme.radius.xxl + theme.spacing.md,
              backgroundColor: "rgba(27, 22, 19, 0.75)",
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Text variant="caption" color="onDark">
              1/{extras.photoCount} · Real photos
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: -theme.radius.xxl,
            backgroundColor: theme.color.surface,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.xl,
            gap: theme.spacing.xl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.color.surfaceDark,
                borderWidth: 3,
                borderColor: theme.color.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="label" style={{ color: theme.color.gold, fontSize: 15 }}>
                {initials(restaurant.name)}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="title" numberOfLines={2}>
                {restaurant.name}
              </Text>
              <Text variant="caption" color="tertiary">
                {meta.join(" · ")}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.color.surfaceMuted,
              borderRadius: theme.radius.xl,
              paddingVertical: theme.spacing.md,
            }}
          >
            <InfoColumn
              icon="mc:star"
              title={extras.rating.toFixed(1)}
              subtitle={`${formatRatingCountLong(extras.ratingCount)} ratings`}
            />
            <View style={{ width: 1, backgroundColor: theme.color.line }} />
            <InfoColumn icon="clock" title={prep ?? "ASAP"} subtitle="Pickup time" />
            <View style={{ width: 1, backgroundColor: theme.color.line }} />
            <InfoColumn
              icon="map-pin"
              title={`${extras.distanceMiles} mi`}
              subtitle={streetAddress(restaurant.address) ?? "Pickup"}
            />
          </View>

          {!restaurant.isOpen ? (
            <View
              style={{
                backgroundColor: theme.color.accentSoft,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              }}
            >
              <Text variant="bodyStrong" color="accent">
                {extras.pausedUntil
                  ? `Paused right now, back at ${extras.pausedUntil}.`
                  : "This restaurant is paused and isn't taking orders right now."}
              </Text>
            </View>
          ) : null}

          {restaurant.deals.length > 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text variant="title">Deals here</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                  <Icon name="mc:check-circle" size={18} color={theme.color.success} />
                  <Text variant="caption" color="success">
                    Best deal auto-applied
                  </Text>
                </View>
              </View>
              <DealCards deals={restaurant.deals} bestDealId={bestDealId} />
            </View>
          ) : null}

          {search !== null ? (
            <TextField
              ref={searchRef}
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${restaurant.name}`}
              accessibilityLabel={`Search the ${restaurant.name} menu`}
              returnKeyType="search"
              icon="search"
              tone="muted"
              shape="pill"
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl }}
              style={{ marginHorizontal: -theme.spacing.xl }}
            >
              {categories.map((candidate) => {
                const isSelected = candidate === activeCategory;
                return (
                  <Pressable
                    key={candidate}
                    onPress={() => setCategory(candidate)}
                    style={{
                      backgroundColor: isSelected ? theme.color.surfaceDark : theme.color.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.color.surfaceDark : theme.color.line,
                      borderRadius: theme.radius.pill,
                      paddingVertical: theme.spacing.sm + 2,
                      paddingHorizontal: theme.spacing.lg,
                    }}
                  >
                    <Text variant="bodyStrong" color={isSelected ? "onDark" : "primary"}>
                      {candidate}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm }}>
              <Text variant="title">{query ? "Results" : activeCategory}</Text>
              <Text variant="caption" color="tertiary">
                Tap a dish for real photos
              </Text>
            </View>
            {visibleItems.map((menuItem) => {
              const quantity = quantityOf(menuItem.id);
              return (
                <MenuItemCard
                  key={menuItem.id}
                  menuItem={menuItem}
                  quantity={quantity}
                  tag={
                    menuItemDealTag(menuItem, restaurant.deals) ??
                    (menuItemDisplayExtras(menuItem.id).mostOrdered ? "Most ordered" : null)
                  }
                  disabled={!restaurant.isOpen}
                  onAdd={() => addItem(menuItem)}
                  onRemove={() => setQuantity(menuItem.id, quantity - 1)}
                />
              );
            })}
            {visibleItems.length === 0 ? (
              <Text variant="body" color="tertiary" style={{ paddingVertical: theme.spacing.lg }}>
                No dishes match that.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {showCartBar ? (
        <CartBar
          restaurant={restaurant}
          itemCount={itemCount}
          subtotalCents={subtotalCents}
          discountCents={quote?.discountCents ?? 0}
          appliedDealName={quote?.appliedDeal?.dealName ?? null}
          onViewOrder={() => router.push("/checkout")}
        />
      ) : null}
      {/* Keeps the photo and the page from scrolling under the phone's status bar. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: theme.color.surfaceDark,
        }}
      />
    </View>
  );
}

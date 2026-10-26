import type { Restaurant } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "../../home/components/TabBar";

export interface CartBarProps {
  restaurant: Restaurant;
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  appliedDealName: string | null;
  onViewOrder: () => void;
}

/** The nearest minimum-spend deal the cart hasn't reached yet, if any. */
function nextUnlock(restaurant: Restaurant, subtotalCents: number) {
  const candidates = restaurant.deals
    .filter((deal) => (deal.conditions.minSubtotalCents ?? 0) > subtotalCents)
    .sort((a, b) => (a.conditions.minSubtotalCents ?? 0) - (b.conditions.minSubtotalCents ?? 0));
  const deal = candidates[0];
  if (!deal?.conditions.minSubtotalCents) return null;

  const remainingCents = deal.conditions.minSubtotalCents - subtotalCents;
  const reward =
    deal.type === "FREE_ITEM"
      ? `a free ${(restaurant.menu.find((item) => item.id === deal.freeItemId)?.name ?? "item").toLowerCase()}`
      : deal.name.toLowerCase();
  return {
    message: `Add ${formatCents(remainingCents)} more for ${reward}`,
    progress: subtotalCents / deal.conditions.minSubtotalCents,
  };
}

export function CartBar({
  restaurant,
  itemCount,
  subtotalCents,
  discountCents,
  appliedDealName,
  onViewOrder,
}: CartBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const unlock = nextUnlock(restaurant, subtotalCents);

  return (
    <View
      style={{
        position: "absolute",
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: Math.max(insets.bottom, theme.spacing.md) + TAB_BAR_HEIGHT + theme.spacing.sm,
        backgroundColor: theme.color.surfaceDark,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        shadowColor: theme.shadow.card.color,
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
    >
      {unlock ? (
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
            <Icon name="gift" size={15} color={theme.color.gold} />
            <Text variant="caption" color="onDark" style={{ flex: 1 }}>
              {unlock.message}
            </Text>
          </View>
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: theme.color.surfaceDarkRaised,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 5,
                width: `${Math.min(unlock.progress, 1) * 100}%`,
                backgroundColor: theme.color.gold,
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surfaceDarkRaised,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="shopping-bag" size={22} color={theme.color.textOnDark} />
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: theme.color.gold,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text variant="label">{itemCount}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="caption" color="onDark" numberOfLines={1} style={{ opacity: 0.85 }}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
            {appliedDealName ? ` · ${appliedDealName}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm }}>
            <Text variant="title" color="onDark">
              {formatCents(subtotalCents - discountCents)}
            </Text>
            {discountCents > 0 ? (
              <Text
                variant="caption"
                color="onDark"
                style={{ opacity: 0.6, textDecorationLine: "line-through" }}
              >
                {formatCents(subtotalCents)}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onViewOrder}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.gold,
            borderRadius: theme.radius.lg,
            paddingVertical: theme.spacing.md + 2,
            paddingHorizontal: theme.spacing.lg,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text variant="bodyStrong">View order</Text>
          <Icon name="arrow-right" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

import type { Restaurant } from "@foodiedeals/shared";
import { formatRatingCountShort, restaurantDisplayExtras } from "@foodiedeals/shared";
import { Badge, Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { dealIcon, prepRange, streetName } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { HeartButton } from "../../favorites/HeartButton";

export interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
}

export function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const theme = useTheme();
  const [topDeal, secondDeal] = restaurant.deals;
  const photo = resolveFoodPhoto(restaurant.heroPhoto);
  const prep = prepRange(restaurant);
  const extras = restaurantDisplayExtras(restaurant.id);
  const meta = [
    restaurant.cuisine,
    streetName(restaurant.address),
    `${extras.distanceMiles} mi`,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={restaurant.isOpen ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={restaurant.name}
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.sm,
        shadowColor: theme.shadow.card.color,
        shadowOpacity: theme.shadow.card.opacity,
        shadowRadius: theme.shadow.card.radius,
        shadowOffset: { width: theme.shadow.card.offsetX, height: theme.shadow.card.offsetY },
        elevation: 2,
      }}
    >
      <View
        style={{
          height: 170,
          borderRadius: theme.radius.xl,
          overflow: "hidden",
          backgroundColor: theme.color.surfaceDark,
        }}
      >
        {photo && restaurant.isOpen ? (
          <Image source={photo} style={{ flex: 1 }} contentFit="cover" />
        ) : null}

        {restaurant.isOpen ? (
          <>
            {topDeal ? (
              <Badge
                label={topDeal.name}
                tone="gold"
                icon="tag"
                style={{ position: "absolute", top: theme.spacing.md, left: theme.spacing.md }}
              />
            ) : null}
            <HeartButton
              restaurantId={restaurant.id}
              style={{ position: "absolute", top: theme.spacing.md, right: theme.spacing.md }}
            />
            {prep ? (
              <Badge
                label={`Ready in ${prep}`}
                tone="dark"
                icon="clock"
                style={{ position: "absolute", bottom: theme.spacing.md, left: theme.spacing.md }}
              />
            ) : null}
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Badge
              label={extras.pausedUntil ? `Paused · back at ${extras.pausedUntil}` : "Paused"}
              tone="neutral"
              icon="mc:pause"
              style={{ alignSelf: "center" }}
            />
          </View>
        )}
      </View>

      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          gap: theme.spacing.xs,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {restaurant.name}
          </Text>
          <Icon name="mc:star" size={16} color={theme.color.gold} />
          <Text variant="bodyStrong">{extras.rating.toFixed(1)}</Text>
          <Text variant="caption" color="tertiary">
            ({formatRatingCountShort(extras.ratingCount)})
          </Text>
        </View>
        <Text variant="caption" color="tertiary" numberOfLines={1}>
          {meta.join("  ·  ")}
        </Text>
        {restaurant.isOpen && secondDeal ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs + 2,
              alignSelf: "flex-start",
              backgroundColor: theme.color.accentSoft,
              borderRadius: theme.radius.sm,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            <Icon name={dealIcon(secondDeal)} size={13} color={theme.color.accent} />
            <Text variant="caption" color="accent">
              Also: {secondDeal.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

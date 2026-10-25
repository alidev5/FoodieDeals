import type { Restaurant } from "@foodiedeals/shared";
import { Badge, StatusDot, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";

export interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
}

export function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const theme = useTheme();
  const topDeal = restaurant.deals[0];
  const photo = resolveFoodPhoto(restaurant.heroPhoto);

  return (
    <Pressable
      onPress={restaurant.isOpen ? onPress : undefined}
      style={{
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        opacity: restaurant.isOpen ? 1 : 0.6,
        shadowColor: theme.shadow.card.color,
        shadowOpacity: theme.shadow.card.opacity,
        shadowRadius: theme.shadow.card.radius,
        shadowOffset: { width: theme.shadow.card.offsetX, height: theme.shadow.card.offsetY },
        elevation: 2,
      }}
    >
      <View style={{ height: 140 }}>
        {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
        <View
          style={{
            position: "absolute",
            top: theme.spacing.sm,
            left: theme.spacing.sm,
          }}
        >
          <Badge label={restaurant.isOpen ? "Open" : "Paused"} />
        </View>
        {topDeal ? (
          <View style={{ position: "absolute", bottom: theme.spacing.sm, left: theme.spacing.sm }}>
            <Badge label={topDeal.name} />
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.md, gap: theme.spacing.xs }}>
        <Text variant="heading">{restaurant.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
          {restaurant.isOpen ? <StatusDot tone="success" /> : null}
          <Text variant="caption" color="secondary">
            {restaurant.cuisine}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

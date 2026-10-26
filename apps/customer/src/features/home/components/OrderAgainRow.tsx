import type { Restaurant } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";

export interface OrderAgainRowProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

export function OrderAgainRow({ restaurants, onSelect }: OrderAgainRowProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl }}
      style={{ marginHorizontal: -theme.spacing.xl }}
    >
      {restaurants.map((restaurant) => {
        const photo = resolveFoodPhoto(restaurant.heroPhoto);
        // Prefer a time-limited deal, since "Today:" reads best with one.
        const deal =
          restaurant.deals.find((candidate) => candidate.conditions.timeWindow) ??
          restaurant.deals[0];
        return (
          <Pressable
            key={restaurant.id}
            onPress={() => onSelect(restaurant)}
            accessibilityLabel={`Order again from ${restaurant.name}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              width: 310,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.sm,
              opacity: restaurant.isOpen ? 1 : 0.6,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
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
              <Text
                variant="caption"
                color={restaurant.isOpen ? "accent" : "tertiary"}
                numberOfLines={1}
              >
                {restaurant.isOpen
                  ? deal
                    ? `Today: ${deal.name}`
                    : "Open now"
                  : "Paused right now"}
              </Text>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.color.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
                marginRight: theme.spacing.xs,
              }}
            >
              <Icon name="repeat" size={16} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

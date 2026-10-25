import { formatCents } from "@foodiedeals/shared";
import { Badge, Button, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { useCartItemCount, useCartStore, useCartSubtotalCents } from "../../cart/store";
import { useRestaurant } from "../../catalog/hooks";
import { MenuItemCard } from "../components/MenuItemCard";
import { useDealEvaluations } from "../hooks/useDealEvaluations";

export function RestaurantScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: restaurant, isLoading } = useRestaurant(id);
  const addItem = useCartStore((state) => state.addItem);
  const evaluations = useDealEvaluations(restaurant);
  const itemCount = useCartItemCount();
  const subtotalCents = useCartSubtotalCents();

  if (isLoading || !restaurant) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.accent} />
      </SafeAreaView>
    );
  }

  const heroPhoto = resolveFoodPhoto(restaurant.heroPhoto);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}>
        <View style={{ height: 180 }}>
          {heroPhoto ? <Image source={heroPhoto} style={{ flex: 1 }} contentFit="cover" /> : null}
        </View>

        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="title">{restaurant.name}</Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <Badge label={restaurant.isOpen ? "Open" : "Paused"} />
              <Badge label={restaurant.cuisine} />
            </View>
          </View>

          {!restaurant.isOpen ? (
            <Text variant="body" color="secondary">
              This restaurant is paused and isn't taking orders right now.
            </Text>
          ) : null}

          {evaluations.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="heading">Deals</Text>
              {evaluations.map((evaluation) => (
                <View key={evaluation.dealId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="body">{evaluation.dealName}</Text>
                  <Text variant="caption" color={evaluation.discountCents > 0 ? "accent" : "secondary"}>
                    {evaluation.discountCents > 0
                      ? `-${formatCents(evaluation.discountCents)}`
                      : evaluation.reason}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="heading">Menu</Text>
            {restaurant.menu.map((menuItem) => (
              <MenuItemCard
                key={menuItem.id}
                menuItem={menuItem}
                onAdd={() => restaurant.isOpen && addItem(menuItem)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {itemCount > 0 ? (
        <View style={{ padding: theme.spacing.lg }}>
          <Button
            label={`View order · ${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatCents(subtotalCents)}`}
            variant="accent"
            onPress={() => router.push("/checkout")}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

import { restaurantDisplayExtras } from "@foodiedeals/shared";
import { Button, Card, Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { View } from "react-native";

import { streetAddress } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";

export interface RestaurantContactCardProps {
  name: string;
  address: string;
  phone: string;
  heroPhoto?: string | null;
  restaurantId?: string;
}

export function RestaurantContactCard({
  name,
  address,
  phone,
  heroPhoto,
  restaurantId,
}: RestaurantContactCardProps) {
  const theme = useTheme();
  const photo = resolveFoodPhoto(heroPhoto ?? undefined);

  const openDirections = () => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const call = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Card style={{ gap: theme.spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
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
          <Text variant="heading">{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="map-pin" size={13} color={theme.color.textTertiary} />
            <Text variant="caption" color="tertiary" numberOfLines={1}>
              {[
                streetAddress(address) ?? address,
                ...(restaurantId
                  ? [
                      `${restaurantDisplayExtras(restaurantId).distanceMiles} mi`,
                      `${restaurantDisplayExtras(restaurantId).walkMinutes} min walk`,
                    ]
                  : []),
              ].join(" · ")}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Button
          label="Directions"
          icon="navigation"
          variant="dark"
          onPress={openDirections}
          style={{ flex: 1 }}
        />
        {phone ? (
          <Button label="Call" icon="phone" variant="muted" onPress={call} style={{ flex: 1 }} />
        ) : null}
      </View>
    </Card>
  );
}

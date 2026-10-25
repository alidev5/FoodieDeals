import type { MenuItem } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { View } from "react-native";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";

export interface MenuItemCardProps {
  menuItem: MenuItem;
  onAdd: () => void;
}

export function MenuItemCard({ menuItem, onAdd }: MenuItemCardProps) {
  const theme = useTheme();
  const photo = resolveFoodPhoto(menuItem.photo);

  return (
    <Card padding="md">
      <View style={{ flexDirection: "row", gap: theme.spacing.md, alignItems: "center" }}>
        {photo ? (
          <Image
            source={photo}
            style={{ width: 64, height: 64, borderRadius: theme.radius.sm }}
            contentFit="cover"
          />
        ) : null}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="body">{menuItem.name}</Text>
          <Text variant="caption" color="secondary">
            {formatCents(menuItem.priceCents)}
          </Text>
        </View>
        <Button label="Add" variant="dark" onPress={onAdd} />
      </View>
    </Card>
  );
}

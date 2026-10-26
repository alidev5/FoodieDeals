import type { MenuItem } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { resolveFoodPhoto } from "../../../lib/foodPhotos";

export interface MenuItemCardProps {
  menuItem: MenuItem;
  quantity: number;
  tag: string | null;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

function RoundButton({
  icon,
  onPress,
  label,
  light,
}: {
  icon: "plus" | "minus";
  onPress: () => void;
  label: string;
  light: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: light ? "rgba(255,255,255,0.25)" : theme.color.surfaceDark,
      }}
    >
      <Icon name={icon} size={16} color={theme.color.textOnDark} />
    </Pressable>
  );
}

export function MenuItemCard({
  menuItem,
  quantity,
  tag,
  disabled = false,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  const theme = useTheme();
  const photo = resolveFoodPhoto(menuItem.photo);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.color.line,
      }}
    >
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        {tag ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              alignSelf: "flex-start",
              backgroundColor: theme.color.accentSoft,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 2,
              marginBottom: 2,
            }}
          >
            <Icon name="mc:fire" size={13} color={theme.color.accent} />
            <Text variant="label" color="accent" style={{ fontSize: 12 }}>
              {tag}
            </Text>
          </View>
        ) : null}
        <Text variant="heading">{menuItem.name}</Text>
        {menuItem.description ? (
          <Text variant="body" color="tertiary" numberOfLines={2}>
            {menuItem.description}
          </Text>
        ) : null}
        <Text variant="heading" style={{ marginTop: 2 }}>
          {formatCents(menuItem.priceCents)}
        </Text>
      </View>

      <View
        style={{
          width: 104,
          height: 104,
          borderRadius: theme.radius.xl,
          overflow: "hidden",
          backgroundColor: theme.color.surfaceMuted,
        }}
      >
        {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
        {disabled ? null : quantity > 0 ? (
          <View
            style={{
              position: "absolute",
              left: theme.spacing.sm,
              right: theme.spacing.sm,
              bottom: theme.spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: theme.color.accent,
              borderRadius: theme.radius.pill,
              padding: 3,
            }}
          >
            <RoundButton
              icon="minus"
              label={`Remove one ${menuItem.name}`}
              onPress={onRemove}
              light
            />
            <Text variant="bodyStrong" color="onDark">
              {quantity}
            </Text>
            <RoundButton icon="plus" label={`Add another ${menuItem.name}`} onPress={onAdd} light />
          </View>
        ) : (
          <View style={{ position: "absolute", right: theme.spacing.sm, bottom: theme.spacing.sm }}>
            <RoundButton icon="plus" label={`Add ${menuItem.name}`} onPress={onAdd} light={false} />
          </View>
        )}
      </View>
    </View>
  );
}

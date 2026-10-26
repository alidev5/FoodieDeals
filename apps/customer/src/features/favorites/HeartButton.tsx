import { Icon, useTheme } from "@foodiedeals/ui-native";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useFavoritesStore, useIsFavorite } from "./favoritesStore";

export interface HeartButtonProps {
  restaurantId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function HeartButton({ restaurantId, size = 40, style }: HeartButtonProps) {
  const theme = useTheme();
  const isFavorite = useIsFavorite(restaurantId);
  const toggle = useFavoritesStore((state) => state.toggle);

  return (
    <Pressable
      onPress={() => toggle(restaurantId)}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
      accessibilityState={{ selected: isFavorite }}
      hitSlop={6}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Icon
        name={isFavorite ? "mc:heart" : "mc:heart-outline"}
        size={size * 0.5}
        color={isFavorite ? theme.color.accent : theme.color.text}
      />
    </Pressable>
  );
}

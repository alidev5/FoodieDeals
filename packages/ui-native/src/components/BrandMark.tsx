import { View } from "react-native";

import { useTheme } from "../theme";

import { Icon } from "./Icon";
import { Text } from "./Text";

export interface BrandMarkProps {
  size?: number;
  /** Shows the "FoodieDeals" wordmark beside the tile. */
  withWordmark?: boolean;
  /** Wordmark color scheme; "dark" renders white text for dark backgrounds. */
  tone?: "light" | "dark";
  subtitle?: string;
}

export function BrandMark({
  size = 48,
  withWordmark = false,
  tone = "light",
  subtitle,
}: BrandMarkProps) {
  const theme = useTheme();
  const onDark = tone === "dark";

  const tile = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: onDark ? theme.color.gold : theme.color.surfaceDark,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        name="mc:silverware-fork-knife"
        size={size * 0.5}
        color={onDark ? theme.color.surfaceDark : theme.color.gold}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.14,
          right: size * 0.14,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.08,
          backgroundColor: theme.color.accent,
        }}
      />
    </View>
  );

  if (!withWordmark) {
    return tile;
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.28 }}>
      {tile}
      <View>
        <Text
          variant="title"
          color={onDark ? "onDark" : "primary"}
          style={{ fontSize: size * 0.5, lineHeight: size * 0.6 }}
        >
          Foodie
          <Text
            variant="title"
            style={{
              color: onDark ? theme.color.gold : theme.color.accent,
              fontSize: size * 0.5,
              lineHeight: size * 0.6,
            }}
          >
            Deals
          </Text>
        </Text>
        {subtitle ? (
          <Text
            variant="caption"
            color={onDark ? "onDark" : "tertiary"}
            style={onDark ? { opacity: 0.6 } : null}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

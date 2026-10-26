import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";

import { useTheme } from "../theme";

export type FeatherIconName = ComponentProps<typeof Feather>["name"];
export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
/** Feather by default; prefix with "mc:" for a MaterialCommunityIcons glyph, e.g. "mc:fire". */
export type IconName = FeatherIconName | `mc:${MaterialIconName}`;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 18, color, style }: IconProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.color.text;

  if (name.startsWith("mc:")) {
    return (
      <MaterialCommunityIcons
        name={name.slice(3) as MaterialIconName}
        size={size}
        color={resolvedColor}
        style={style}
      />
    );
  }
  return <Feather name={name as FeatherIconName} size={size} color={resolvedColor} style={style} />;
}

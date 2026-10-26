import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { resolveFontFamily, useTheme } from "../theme";

export type TextVariant =
  "hero" | "display" | "title" | "heading" | "body" | "bodyStrong" | "caption" | "label";
export type TextColor = "primary" | "secondary" | "tertiary" | "onDark" | "accent" | "success";

export interface TextComponentProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
}

const COLOR_TOKEN_KEY: Record<
  TextColor,
  "text" | "textSecondary" | "textTertiary" | "textOnDark" | "accent" | "success"
> = {
  primary: "text",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  onDark: "textOnDark",
  accent: "accent",
  success: "success",
};

export function Text({ variant = "body", color = "primary", style, ...rest }: TextComponentProps) {
  const theme = useTheme();
  const scale = theme.type.scale[variant];
  const fontFamily = resolveFontFamily(scale.fontFamily, scale.fontWeight);

  return (
    <RNText
      style={[
        {
          fontFamily,
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          color: theme.color[COLOR_TOKEN_KEY[color]],
        },
        style,
      ]}
      {...rest}
    />
  );
}

import {
  forwardRef,
  useState,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
import {
  Platform,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { resolveFontFamily, useTheme } from "../theme";

import { Icon, type IconName } from "./Icon";

export type TextFieldRef = ComponentRef<typeof TextInput>;

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  /** Leading icon, e.g. "search". */
  icon?: IconName;
  /** Right-aligned content inside the field, e.g. a clear button. */
  trailing?: ReactNode;
  /**
   * "surface" sits on the page background, "muted" inside a white card, and "onDark" on a dark
   * card, where the focus ring turns gold so it stays visible.
   */
  tone?: "surface" | "muted" | "onDark";
  shape?: "rounded" | "pill";
  size?: "md" | "lg";
  invalid?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

const WEB_TRANSITION =
  Platform.OS === "web"
    ? ({
        transitionProperty: "border-color, box-shadow, background-color",
        transitionDuration: "180ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      } as ViewStyle)
    : null;

/**
 * The one text input for both apps: a hairline border at rest, and on focus a darker border,
 * a white fill and a soft halo, so it's always clear which field is being typed into.
 */
export const TextField: ForwardRefExoticComponent<TextFieldProps & RefAttributes<TextFieldRef>> =
  forwardRef<TextFieldRef, TextFieldProps>(function TextField(
    {
      icon,
      trailing,
      tone = "surface",
      shape = "rounded",
      size = "md",
      invalid = false,
      style,
      inputStyle,
      onFocus,
      onBlur,
      editable = true,
      ...rest
    },
    ref,
  ) {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const isLarge = size === "lg";

    const isOnDark = tone === "onDark";
    const borderColor = invalid
      ? theme.color.accent
      : isFocused
        ? isOnDark
          ? theme.color.gold
          : theme.color.surfaceDark
        : tone === "muted"
          ? "rgba(27, 22, 19, 0.06)"
          : isOnDark
            ? "transparent"
            : theme.color.line;
    const halo = invalid
      ? "rgba(229, 72, 43, 0.14)"
      : isOnDark
        ? "rgba(255, 197, 61, 0.28)"
        : "rgba(27, 22, 19, 0.07)";

    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            minHeight: isLarge ? 56 : 50,
            paddingLeft: icon ? theme.spacing.lg : 0,
            paddingRight: trailing ? theme.spacing.xs + 2 : 0,
            borderRadius: shape === "pill" ? theme.radius.pill : theme.radius.md,
            borderWidth: 1.5,
            borderColor,
            backgroundColor:
              isFocused || tone !== "muted" ? theme.color.surface : theme.color.surfaceMuted,
            opacity: editable ? 1 : 0.6,
          },
          // Web only: on native (New Architecture), toggling shadow styles when the input gains
          // focus re-creates the wrapper view, which blurs the input and closes the keyboard.
          Platform.OS === "web" && (isFocused || invalid)
            ? ({ boxShadow: `0 0 0 4px ${halo}` } as ViewStyle)
            : null,
          WEB_TRANSITION,
          style,
        ]}
      >
        {icon ? (
          <Icon
            name={icon}
            size={18}
            color={isFocused ? theme.color.text : theme.color.textTertiary}
          />
        ) : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={theme.color.textTertiary}
          selectionColor={theme.color.accent}
          cursorColor={theme.color.accent}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[
            {
              flex: 1,
              minWidth: 0,
              alignSelf: "stretch",
              paddingHorizontal: icon ? 0 : theme.spacing.lg,
              paddingVertical: isLarge ? theme.spacing.lg : theme.spacing.md,
              fontFamily: resolveFontFamily("body", "500"),
              // 16px keeps iOS Safari from zooming the page when the field is focused.
              fontSize: 16,
              color: theme.color.text,
            },
            Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : null,
            inputStyle,
          ]}
          {...rest}
        />
        {trailing}
      </View>
    );
  });

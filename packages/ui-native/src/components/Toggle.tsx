import { Pressable, View } from "react-native";

import { useTheme } from "../theme";

import { Icon } from "./Icon";
import { Text } from "./Text";

export interface ToggleProps {
  isOn: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: (next: boolean) => void;
}

/** Segmented Open / Paused control: green when on, accent red when off. */
export function Toggle({ isOn, onLabel, offLabel, onToggle }: ToggleProps) {
  const theme = useTheme();

  const segment = (value: boolean, label: string) => {
    const isSelected = value === isOn;
    const selectedBackground = value ? theme.color.success : theme.color.accent;
    const foreground = isSelected ? theme.color.textOnDark : theme.color.textTertiary;

    return (
      <Pressable
        key={label}
        onPress={() => !isSelected && onToggle(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          backgroundColor: isSelected ? selectedBackground : "transparent",
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        {value ? (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: foreground }} />
        ) : (
          <Icon name="pause" size={13} color={foreground} />
        )}
        <Text variant="label" style={{ color: foreground, fontSize: 14 }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.color.line,
        padding: 4,
      }}
    >
      {segment(true, onLabel)}
      {segment(false, offLabel)}
    </View>
  );
}

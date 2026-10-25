import { Text, Toggle, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

export interface HeaderProps {
  restaurantName: string;
  isOpen: boolean;
  onToggleOpen: (next: boolean) => void;
}

export function Header({ restaurantName, isOpen, onToggleOpen }: HeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: theme.spacing.lg,
      }}
    >
      <Text variant="title">{restaurantName}</Text>
      <Toggle isOn={isOpen} onLabel="Open" offLabel="Paused" onToggle={onToggleOpen} />
    </View>
  );
}

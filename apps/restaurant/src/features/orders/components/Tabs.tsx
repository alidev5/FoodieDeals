import { Text, useTheme } from "@foodiedeals/ui-native";
import { Pressable, View } from "react-native";

export type OrdersTab = "ACTIVE" | "READY" | "DONE";

const TABS: Array<{ key: OrdersTab; label: string }> = [
  { key: "ACTIVE", label: "Active" },
  { key: "READY", label: "Ready" },
  { key: "DONE", label: "Done" },
];

export interface TabsProps {
  selected: OrdersTab;
  onSelect: (tab: OrdersTab) => void;
}

export function Tabs({ selected, onSelect }: TabsProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
      {TABS.map((tab) => {
        const isSelected = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={{
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.pill,
              backgroundColor: isSelected ? theme.color.surfaceDark : "transparent",
            }}
          >
            <Text variant="label" color={isSelected ? "onDark" : "secondary"}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

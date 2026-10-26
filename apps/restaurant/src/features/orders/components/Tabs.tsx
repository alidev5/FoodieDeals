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
  counts: Record<OrdersTab, number>;
}

export function Tabs({ selected, onSelect, counts }: TabsProps) {
  const theme = useTheme();

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
      {TABS.map((tab) => {
        const isSelected = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.sm + 2,
              borderRadius: theme.radius.pill,
              backgroundColor: isSelected ? theme.color.surfaceDark : "transparent",
            }}
          >
            <Text variant="bodyStrong" color={isSelected ? "onDark" : "secondary"}>
              {tab.label}
            </Text>
            <View
              style={{
                minWidth: 22,
                paddingHorizontal: 6,
                borderRadius: theme.radius.pill,
                alignItems: "center",
                backgroundColor: isSelected ? theme.color.gold : theme.color.surfaceMuted,
              }}
            >
              <Text variant="label">{counts[tab.key]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

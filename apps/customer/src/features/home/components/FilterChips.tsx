import type { DealType } from "@foodiedeals/shared";
import { Text, useTheme } from "@foodiedeals/ui-native";
import { Pressable, ScrollView } from "react-native";

export type HomeFilter = "ALL" | "OPEN" | DealType;

const FILTERS: Array<{ key: HomeFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open now" },
  { key: "BOGO", label: "BOGO" },
  { key: "PERCENT_OFF", label: "% off" },
  { key: "FREE_ITEM", label: "Free item" },
  { key: "FIXED_PRICE_BUNDLE", label: "Bundle" },
];

export interface FilterChipsProps {
  selected: HomeFilter;
  onSelect: (filter: HomeFilter) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
      {FILTERS.map((filter) => {
        const isSelected = filter.key === selected;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={{
              backgroundColor: isSelected ? theme.color.surfaceDark : theme.color.surface,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: isSelected ? theme.color.surfaceDark : theme.color.line,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Text variant="label" color={isSelected ? "onDark" : "primary"}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

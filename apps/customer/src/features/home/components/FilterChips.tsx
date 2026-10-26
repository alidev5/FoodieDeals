import type { DealType } from "@foodiedeals/shared";
import { Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { Pressable, ScrollView, View } from "react-native";

export type HomeFilter = "ALL" | "OPEN" | DealType;

const FILTERS: Array<{ key: HomeFilter; label: string; icon?: IconName }> = [
  { key: "ALL", label: "All" },
  { key: "BOGO", label: "Buy 1 Get 1", icon: "gift" },
  { key: "PERCENT_OFF", label: "% Off", icon: "percent" },
  { key: "FREE_ITEM", label: "Free", icon: "tag" },
  { key: "FIXED_PRICE_BUNDLE", label: "Bundles", icon: "layers" },
  { key: "OPEN", label: "Open now", icon: "clock" },
];

export interface FilterChipsProps {
  selected: HomeFilter;
  onSelect: (filter: HomeFilter) => void;
  allCount: number;
}

export function FilterChips({ selected, onSelect, allCount }: FilterChipsProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl }}
      style={{ marginHorizontal: -theme.spacing.xl }}
    >
      {FILTERS.map((filter) => {
        const isSelected = filter.key === selected;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              backgroundColor: isSelected ? theme.color.surfaceDark : theme.color.surface,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: isSelected ? theme.color.surfaceDark : theme.color.line,
              paddingVertical: theme.spacing.sm + 2,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            {filter.icon ? (
              <Icon
                name={filter.icon}
                size={15}
                color={isSelected ? theme.color.textOnDark : theme.color.accent}
              />
            ) : null}
            <Text variant="bodyStrong" color={isSelected ? "onDark" : "primary"}>
              {filter.label}
            </Text>
            {filter.key === "ALL" ? (
              <View
                style={{
                  backgroundColor: theme.color.gold,
                  borderRadius: theme.radius.pill,
                  minWidth: 22,
                  paddingHorizontal: 6,
                  alignItems: "center",
                }}
              >
                <Text variant="label" style={{ fontSize: 12 }}>
                  {allCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

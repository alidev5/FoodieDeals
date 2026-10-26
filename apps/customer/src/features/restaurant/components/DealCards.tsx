import type { Deal } from "@foodiedeals/shared";
import { Text, useTheme } from "@foodiedeals/ui-native";
import { ScrollView, View } from "react-native";

import { dealBadgeText, dealConditionsText } from "../../../lib/display";

export interface DealCardsProps {
  deals: Deal[];
  bestDealId: string | null;
}

export function DealCards({ deals, bestDealId }: DealCardsProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl }}
      style={{ marginHorizontal: -theme.spacing.xl }}
    >
      {deals.map((deal) => {
        const isBest = deal.id === bestDealId;
        return (
          <View
            key={deal.id}
            style={{
              width: 260,
              gap: theme.spacing.sm,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.xl,
              backgroundColor: isBest ? theme.color.goldSoft : theme.color.surfaceMuted,
              borderWidth: 1.5,
              borderColor: isBest ? theme.color.gold : "transparent",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  minWidth: 48,
                  height: 48,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                  backgroundColor: isBest ? theme.color.gold : theme.color.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  variant="heading"
                  style={{ color: isBest ? theme.color.text : theme.color.textOnDark }}
                >
                  {dealBadgeText(deal)}
                </Text>
              </View>
              {isBest ? (
                <View
                  style={{
                    backgroundColor: theme.color.surfaceDark,
                    borderRadius: theme.radius.pill,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: 3,
                  }}
                >
                  <Text variant="label" style={{ color: theme.color.gold, fontSize: 11 }}>
                    BEST VALUE
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="bodyStrong" numberOfLines={1}>
              {deal.name}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {dealConditionsText(deal)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

import type { DealEvaluation, DealType } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

import { dealIcon } from "../../../lib/display";

export interface DealListProps {
  evaluations: DealEvaluation[];
  appliedDealId: string | null;
  dealTypes: Record<string, DealType>;
}

export function DealList({ evaluations, appliedDealId, dealTypes }: DealListProps) {
  const theme = useTheme();

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      {evaluations.map((evaluation) => {
        const isApplied = evaluation.dealId === appliedDealId;
        const type = dealTypes[evaluation.dealId] ?? "PERCENT_OFF";
        return (
          <View
            key={evaluation.dealId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              padding: theme.spacing.md,
              borderRadius: theme.radius.lg,
              borderWidth: 1.5,
              borderColor: isApplied ? theme.color.gold : theme.color.line,
              backgroundColor: isApplied ? theme.color.goldSoft : theme.color.surface,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.sm,
                backgroundColor: isApplied ? theme.color.accent : theme.color.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={dealIcon({ type })}
                size={20}
                color={isApplied ? theme.color.textOnDark : theme.color.textTertiary}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                variant="bodyStrong"
                color={isApplied ? "primary" : "tertiary"}
                numberOfLines={1}
                style={{ fontSize: 14 }}
              >
                {evaluation.dealName}
              </Text>
              <Text
                variant="caption"
                color={isApplied ? "success" : "tertiary"}
                numberOfLines={1}
                style={{ fontSize: 12 }}
              >
                {isApplied
                  ? "Best deal · saves you the most"
                  : (evaluation.reason ?? "Saves less on this order")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: theme.spacing.xs }}>
              {evaluation.discountCents > 0 ? (
                <Text variant="bodyStrong" color={isApplied ? "accent" : "tertiary"}>
                  -{formatCents(evaluation.discountCents)}
                </Text>
              ) : null}
              {isApplied ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.color.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="check" size={14} color={theme.color.textOnDark} />
                </View>
              ) : (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: theme.color.line,
                  }}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

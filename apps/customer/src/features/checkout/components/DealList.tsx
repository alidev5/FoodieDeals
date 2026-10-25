import type { DealEvaluation } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Card, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

export interface DealListProps {
  evaluations: DealEvaluation[];
  appliedDealId: string | null;
}

export function DealList({ evaluations, appliedDealId }: DealListProps) {
  const theme = useTheme();

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {evaluations.map((evaluation) => {
        const isApplied = evaluation.dealId === appliedDealId;
        return (
          <Card
            key={evaluation.dealId}
            variant={isApplied ? "outline" : "light"}
            padding="md"
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm }}>
              <Text variant="body" color="primary">
                {evaluation.dealName}
              </Text>
              {isApplied ? (
                <Text variant="body" color="accent">
                  -{formatCents(evaluation.discountCents)}
                </Text>
              ) : null}
            </View>
            {!isApplied && evaluation.reason ? (
              <Text variant="caption" color="secondary">
                {evaluation.reason}
              </Text>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

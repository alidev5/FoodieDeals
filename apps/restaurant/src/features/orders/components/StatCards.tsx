import { formatCents } from "@foodiedeals/shared";
import { Card, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

import type { RestaurantStats } from "../../../lib/restaurantApi";

export interface StatCardsProps {
  stats: RestaurantStats;
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card padding="md" style={{ flex: 1 }}>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="title" style={{ marginTop: theme.spacing.xs }}>
        {value}
      </Text>
    </Card>
  );
}

export function StatCards({ stats }: StatCardsProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
      <Stat label="Active" value={String(stats.active)} />
      <Stat label="Ready" value={String(stats.ready)} />
      <Stat label="Completed today" value={String(stats.completedToday)} />
      <Stat label="Revenue today" value={formatCents(stats.revenueTodayCents)} />
    </View>
  );
}

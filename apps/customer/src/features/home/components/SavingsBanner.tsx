import type { Restaurant } from "@foodiedeals/shared";
import { Card, Text, useTheme } from "@foodiedeals/ui-native";

export interface SavingsBannerProps {
  restaurants: Restaurant[];
}

function findBestPercentOff(restaurants: Restaurant[]) {
  let best: { restaurantName: string; percent: number } | null = null;
  for (const restaurant of restaurants) {
    for (const deal of restaurant.deals) {
      if (deal.type !== "PERCENT_OFF") continue;
      if (!best || deal.percent > best.percent) {
        best = { restaurantName: restaurant.name, percent: deal.percent };
      }
    }
  }
  return best;
}

export function SavingsBanner({ restaurants }: SavingsBannerProps) {
  const theme = useTheme();
  const best = findBestPercentOff(restaurants);

  if (!best) {
    return null;
  }

  return (
    <Card variant="dark" padding="lg">
      <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
        Today's best deal
      </Text>
      <Text variant="title" color="accent" style={{ marginTop: theme.spacing.xs }}>
        Up to {best.percent}% off
      </Text>
      <Text variant="body" color="onDark" style={{ marginTop: theme.spacing.xs }}>
        at {best.restaurantName}
      </Text>
    </Card>
  );
}

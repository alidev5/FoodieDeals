import { formatCents } from "@foodiedeals/shared";
import { Card, Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { View } from "react-native";

import type { RestaurantStats } from "../../../lib/restaurantApi";
import { useDashboardLayout } from "../../../lib/useDashboardLayout";

export interface StatCardsProps {
  stats: RestaurantStats;
}

interface Trend {
  label: string;
  isGood: boolean;
}

function countTrend(today: number, yesterday: number): Trend | null {
  if (today === yesterday) return null;
  const delta = today - yesterday;
  return { label: `${delta > 0 ? "+" : ""}${delta}`, isGood: delta > 0 };
}

function percentTrend(today: number, yesterday: number): Trend | null {
  if (yesterday <= 0 || today === yesterday) return null;
  const percent = Math.round(((today - yesterday) / yesterday) * 100);
  return { label: `${percent > 0 ? "+" : ""}${percent}%`, isGood: percent > 0 };
}

function prepTrend(today: number | null, yesterday: number | null): Trend | null {
  if (today === null || yesterday === null || today === yesterday) return null;
  const delta = today - yesterday;
  return { label: `${delta > 0 ? "+" : ""}${delta} min`, isGood: delta < 0 };
}

function Stat({
  icon,
  tint,
  value,
  label,
  trend,
  isHalfWidth,
}: {
  icon: IconName;
  tint: string;
  value: string;
  label: string;
  trend: Trend | null;
  isHalfWidth: boolean;
}) {
  const theme = useTheme();
  const trendColor = trend?.isGood ? theme.color.success : theme.color.accent;
  return (
    <Card
      padding="lg"
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: isHalfWidth ? "40%" : 0,
        minWidth: 0,
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.sm,
            backgroundColor: tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={18} />
        </View>
        {trend ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Icon
              name={trend.isGood ? "trending-up" : "trending-down"}
              size={14}
              color={trendColor}
            />
            <Text variant="label" style={{ color: trendColor }}>
              {trend.label}
            </Text>
          </View>
        ) : null}
      </View>
      <View>
        <Text variant="title" style={{ fontSize: 28, lineHeight: 34 }} numberOfLines={1}>
          {value}
        </Text>
        <Text variant="caption" color="tertiary">
          {label}
        </Text>
      </View>
    </Card>
  );
}

export function StatCards({ stats }: StatCardsProps) {
  const theme = useTheme();
  const { isStacked } = useDashboardLayout();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
      <Stat
        isHalfWidth={isStacked}
        icon="file-text"
        tint={theme.color.goldSoft}
        value={String(stats.ordersToday)}
        label="Orders today"
        trend={countTrend(stats.ordersToday, stats.ordersYesterday)}
      />
      <Stat
        isHalfWidth={isStacked}
        icon="dollar-sign"
        tint={theme.color.successSoft}
        value={formatCents(stats.salesTodayCents)}
        label="Sales today"
        trend={percentTrend(stats.salesTodayCents, stats.salesYesterdayCents)}
      />
      <Stat
        isHalfWidth={isStacked}
        icon="users"
        tint={theme.color.accentSoft}
        value={String(stats.newCustomersToday)}
        label="New customers"
        trend={countTrend(stats.newCustomersToday, stats.newCustomersYesterday)}
      />
      <Stat
        isHalfWidth={isStacked}
        icon="clock"
        tint={theme.color.surfaceMuted}
        value={stats.avgPrepMinutesToday !== null ? `${stats.avgPrepMinutesToday} min` : "—"}
        label="Avg. prep time"
        trend={prepTrend(stats.avgPrepMinutesToday, stats.avgPrepMinutesYesterday)}
      />
    </View>
  );
}

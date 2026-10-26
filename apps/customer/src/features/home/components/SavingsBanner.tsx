import { formatCents } from "@foodiedeals/shared";
import { Badge, GradientFill, Text, useTheme } from "@foodiedeals/ui-native";
import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import type { CustomerSummary } from "../api/customerApi";

export interface SavingsBannerProps {
  summary: CustomerSummary | undefined;
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Cumulative savings as a polyline, scaled into width × height. */
function sparklinePoints(perOrderCents: number[], width: number, height: number) {
  let running = 0;
  const cumulative = [0, ...perOrderCents.map((cents) => (running += cents))];
  const max = Math.max(...cumulative, 1);
  return cumulative.map((value, index) => ({
    x: (index / (cumulative.length - 1)) * width,
    y: height - (value / max) * height,
  }));
}

export function SavingsBanner({ summary }: SavingsBannerProps) {
  const theme = useTheme();
  const [chartWidth, setChartWidth] = useState(0);
  const saved = summary?.savedThisMonthCents ?? 0;
  const change = summary ? percentChange(saved, summary.savedLastMonthCents) : null;
  const pickups = summary?.pickupsThisMonth ?? 0;
  const series = summary?.savingsThisMonthCents ?? [];
  const chartHeight = 44;
  const points =
    chartWidth > 0 && series.length >= 2
      ? sparklinePoints(series, chartWidth - 10, chartHeight - 10)
      : [];
  const last = points[points.length - 1];

  return (
    <View
      style={{
        borderRadius: theme.radius.xxl,
        backgroundColor: theme.color.surfaceDark,
        padding: theme.spacing.xl,
        overflow: "hidden",
        gap: theme.spacing.md,
      }}
    >
      <GradientFill
        borderRadius={theme.radius.xxl}
        layers={[
          {
            kind: "linear",
            from: { x: 0.35, y: 0.6 },
            to: { x: 1, y: 0 },
            stops: [
              { offset: 0, color: theme.color.surfaceDark, opacity: 0 },
              { offset: 1, color: theme.color.accentDeep, opacity: 0.95 },
            ],
          },
        ]}
      />

      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <View style={{ gap: 2 }}>
          <Text variant="body" color="onDark" style={{ opacity: 0.85 }}>
            You've saved this month
          </Text>
          <Text variant="display" color="onDark" style={{ fontSize: 40, lineHeight: 46 }}>
            {formatCents(saved)}
          </Text>
        </View>
        {change !== null ? (
          <Badge
            label={`${change >= 0 ? "+" : ""}${change}%`}
            tone="gold"
            size="sm"
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.sm }}>
        <Badge
          label={`${pickups} pickup${pickups === 1 ? "" : "s"}`}
          tone="dark"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        />
        <Badge
          label="$0 delivery fees"
          tone="dark"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        />
        <View
          style={{ flex: 1, height: chartHeight }}
          onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
        >
          {points.length > 0 && last ? (
            <Svg width={chartWidth} height={chartHeight}>
              <Polyline
                points={points.map((point) => `${point.x + 2},${point.y + 6}`).join(" ")}
                fill="none"
                stroke={theme.color.gold}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle
                cx={last.x + 2}
                cy={last.y + 6}
                r={6}
                fill={theme.color.gold}
                opacity={0.35}
              />
              <Circle cx={last.x + 2} cy={last.y + 6} r={3.5} fill={theme.color.gold} />
            </Svg>
          ) : null}
        </View>
      </View>
    </View>
  );
}

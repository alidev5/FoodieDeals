import { formatCents } from "@foodiedeals/shared";
import { Badge, Card, Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { useMemo } from "react";
import { FlatList, View } from "react-native";

import { useOrders } from "../../orders/hooks/useOrders";
import { useStats } from "../../orders/hooks/useStats";
import { DashboardShell } from "../../shell/components/DashboardShell";

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function SummaryCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  const theme = useTheme();
  return (
    <Card padding="lg" style={{ flex: 1, gap: theme.spacing.xs }}>
      <Text variant="caption" color="tertiary">
        {label}
      </Text>
      <Text variant="title" style={{ fontSize: 28, lineHeight: 34 }}>
        {value}
      </Text>
      <Text variant="caption" color="secondary">
        {caption}
      </Text>
    </Card>
  );
}

export function PayoutsScreen() {
  const theme = useTheme();
  const { data: orders } = useOrders();
  const { data: stats } = useStats();

  const paidOutCents = useMemo(
    () =>
      (orders ?? [])
        .filter((order) => order.paidOutAt)
        .reduce((sum, order) => sum + order.restaurantReceivesCents, 0),
    [orders],
  );

  return (
    <DashboardShell>
      <FlatList
        data={orders ?? []}
        keyExtractor={(order) => order.id}
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
            <View style={{ gap: 2 }}>
              <Text variant="display">Payouts</Text>
              <Text variant="body" color="tertiary">
                Your 95% share of every order, after the 5% FoodieDeals fee.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <SummaryCard
                label="Awaiting payout"
                value={formatCents(stats?.owedCents ?? 0)}
                caption={`${stats?.owedOrderCount ?? 0} order${stats?.owedOrderCount === 1 ? "" : "s"}`}
              />
              <SummaryCard
                label="Earned today"
                value={formatCents(stats?.earnedTodayCents ?? 0)}
                caption="Your share of today's sales"
              />
              <SummaryCard
                label="Paid out so far"
                value={formatCents(paidOutCents)}
                caption="Sent by FoodieDeals"
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.md,
                backgroundColor: theme.color.goldSoft,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              }}
            >
              <Icon name="info" size={18} style={{ marginTop: 2 }} />
              <Text variant="body" style={{ flex: 1 }}>
                Customers pay FoodieDeals at checkout. FoodieDeals pays your share out to you
                separately, so new orders show as awaiting payout until that payment is sent.
              </Text>
            </View>

            <Text variant="heading">Orders</Text>
          </View>
        }
        renderItem={({ item: order }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.lg,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">
                #{order.orderNumber} · {order.pickupName}
              </Text>
              <Text variant="caption" color="tertiary">
                {DATE_FORMAT.format(new Date(order.createdAt))} · Paid{" "}
                {formatCents(order.totalCents)} · Fee {formatCents(order.platformFeeCents)}
              </Text>
            </View>
            <Text variant="heading">{formatCents(order.restaurantReceivesCents)}</Text>
            {order.paidOutAt ? (
              <Badge label="Paid out" tone="success" icon="check" />
            ) : (
              <Badge label="Awaiting payout" tone="goldSoft" icon="clock" />
            )}
          </View>
        )}
      />
    </DashboardShell>
  );
}

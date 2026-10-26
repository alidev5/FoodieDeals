import { formatCents, type Deal } from "@foodiedeals/shared";
import {
  Badge,
  Button,
  Card,
  Icon,
  resolveFoodPhoto,
  Text,
  useTheme,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import {
  useClearRestaurantSession,
  useRestaurantSession,
} from "../../auth/hooks/useRestaurantAuth";
import { useRestaurants } from "../../catalog/hooks/useRestaurants";
import { StatCards } from "../../orders/components/StatCards";
import { useStats } from "../../orders/hooks/useStats";
import { DashboardShell } from "../components/DashboardShell";

function useCurrentRestaurant() {
  const { data: session } = useRestaurantSession();
  const { data: restaurants } = useRestaurants();
  return restaurants?.find((candidate) => candidate.id === session?.restaurantId);
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <DashboardShell>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}
      >
        <View style={{ gap: 2 }}>
          <Text variant="display">{title}</Text>
          <Text variant="body" color="tertiary">
            {subtitle}
          </Text>
        </View>
        {children}
      </ScrollView>
    </DashboardShell>
  );
}

function dealSummary(deal: Deal): string {
  const parts: string[] = [];
  const { minSubtotalCents, timeWindow, firstVisitOnly } = deal.conditions;
  if (minSubtotalCents) parts.push(`Orders over ${formatCents(minSubtotalCents)}`);
  if (timeWindow) {
    const toClock = (minute: number) =>
      `${Math.floor(minute / 60) % 12 || 12}${minute >= 720 ? "PM" : "AM"}`;
    parts.push(`${toClock(timeWindow.startMinute)}–${toClock(timeWindow.endMinute)}`);
  }
  if (firstVisitOnly) parts.push("First visit only");
  return parts.length > 0 ? parts.join(" · ") : "Every pickup order, all day";
}

const DEAL_TYPE_LABEL: Record<Deal["type"], string> = {
  PERCENT_OFF: "% off",
  BOGO: "Buy 1 get 1",
  FREE_ITEM: "Free item",
  FIXED_PRICE_BUNDLE: "Bundle",
};

export function DealsScreen() {
  const theme = useTheme();
  const restaurant = useCurrentRestaurant();

  return (
    <Section
      title="Deals"
      subtitle="Live on the customer app; the best one is applied automatically"
    >
      {(restaurant?.deals ?? []).map((deal) => (
        <Card
          key={deal.id}
          style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.lg }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.color.goldSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="tag" size={20} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{deal.name}</Text>
            <Text variant="caption" color="tertiary">
              {dealSummary(deal)}
            </Text>
          </View>
          <Badge label={DEAL_TYPE_LABEL[deal.type]} tone="muted" />
          <Badge label="Active" tone="success" dot />
        </Card>
      ))}
    </Section>
  );
}

export function MenuScreen() {
  const theme = useTheme();
  const restaurant = useCurrentRestaurant();

  return (
    <Section title="Menu" subtitle={`${restaurant?.menu.length ?? 0} dishes customers can order`}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg }}>
        {(restaurant?.menu ?? []).map((item) => {
          const photo = resolveFoodPhoto(item.photo);
          return (
            <Card key={item.id} padding="md" style={{ width: 260, gap: theme.spacing.sm }}>
              <View
                style={{
                  height: 140,
                  borderRadius: theme.radius.lg,
                  overflow: "hidden",
                  backgroundColor: theme.color.surfaceMuted,
                }}
              >
                {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: theme.spacing.sm,
                }}
              >
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="bodyStrong">{formatCents(item.priceCents)}</Text>
              </View>
              {item.description ? (
                <Text variant="caption" color="tertiary" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Section>
  );
}

export function InsightsScreen() {
  const theme = useTheme();
  const { data: stats } = useStats();

  return (
    <Section title="Insights" subtitle="Today compared with yesterday">
      {stats ? <StatCards stats={stats} /> : null}
      {stats ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <Card style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="caption" color="tertiary">
              Average order today
            </Text>
            <Text variant="title">
              {stats.ordersToday > 0
                ? formatCents(Math.round(stats.salesTodayCents / stats.ordersToday))
                : "—"}
            </Text>
          </Card>
          <Card style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="caption" color="tertiary">
              Your share today
            </Text>
            <Text variant="title">{formatCents(stats.earnedTodayCents)}</Text>
          </Card>
          <Card style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="caption" color="tertiary">
              Picked up today
            </Text>
            <Text variant="title">{stats.doneToday}</Text>
          </Card>
        </View>
      ) : null}
    </Section>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const restaurant = useCurrentRestaurant();
  const clearSession = useClearRestaurantSession();

  const rows: Array<[string, string]> = restaurant
    ? [
        ["Name", restaurant.name],
        ["Cuisine", restaurant.cuisine],
        ["Address", restaurant.address ?? "—"],
        ["Phone", restaurant.phone ?? "—"],
        [
          "Prep time",
          restaurant.prepMinutesMin && restaurant.prepMinutesMax
            ? `${restaurant.prepMinutesMin}–${restaurant.prepMinutesMax} min`
            : "—",
        ],
      ]
    : [];

  return (
    <Section title="Settings" subtitle="Restaurant details shown to customers">
      <Card style={{ gap: theme.spacing.md }}>
        {rows.map(([label, value]) => (
          <View key={label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="body" color="secondary">
              {label}
            </Text>
            <Text variant="bodyStrong">{value}</Text>
          </View>
        ))}
      </Card>
      <Button
        label="Switch restaurant"
        icon="log-out"
        variant="dark"
        style={{ alignSelf: "flex-start" }}
        onPress={async () => {
          await clearSession.mutateAsync();
          router.replace("/");
        }}
      />
    </Section>
  );
}

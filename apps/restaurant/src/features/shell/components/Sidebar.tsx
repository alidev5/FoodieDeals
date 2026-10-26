import { formatCents } from "@foodiedeals/shared";
import { BrandMark, Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import type { RestaurantStats } from "../../../lib/restaurantApi";
import { setSidebarCollapsed } from "../../../lib/sidebarPreference";
import { useClearRestaurantSession } from "../../auth/hooks/useRestaurantAuth";

type NavHref = "/orders" | "/deals" | "/menu" | "/insights" | "/payouts" | "/settings";

const NAV_ITEMS: Array<{ href: NavHref; label: string; icon: IconName }> = [
  { href: "/orders", label: "Orders", icon: "mc:receipt" },
  { href: "/deals", label: "Deals", icon: "tag" },
  { href: "/menu", label: "Menu", icon: "book-open" },
  { href: "/insights", label: "Insights", icon: "bar-chart-2" },
  { href: "/payouts", label: "Payouts", icon: "mc:wallet-outline" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export interface SidebarProps {
  restaurantName: string;
  restaurantStreet: string | null;
  stats: RestaurantStats | undefined;
  /** Icon-only rail, chosen by the user or forced on narrow windows. */
  isRail: boolean;
  /** False when the window is too narrow for the full sidebar. */
  canExpand: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word === "&" || /^[A-Za-z]/.test(word))
    .filter((word) => !["Kitchen", "House", "Bar"].includes(word))
    .map((word) => (word === "&" ? "&" : word[0]!.toUpperCase()))
    .join("")
    .slice(0, 3);
}

function CountBadge({ count, floating }: { count: number; floating: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: theme.color.accent,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 5,
        },
        floating
          ? {
              position: "absolute",
              top: 4,
              right: 4,
              borderWidth: 2,
              borderColor: theme.color.surfaceDark,
            }
          : null,
      ]}
    >
      <Text variant="label" color="onDark" style={{ fontSize: 11, lineHeight: 13 }}>
        {count}
      </Text>
    </View>
  );
}

export function Sidebar({
  restaurantName,
  restaurantStreet,
  stats,
  isRail,
  canExpand,
}: SidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useClearRestaurantSession();

  const switchRestaurant = async () => {
    await clearSession.mutateAsync();
    router.replace("/");
  };

  return (
    <View
      style={{
        width: isRail ? 80 : 248,
        backgroundColor: theme.color.surfaceDark,
        borderRightWidth: 1,
        borderRightColor: "rgba(255, 255, 255, 0.06)",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: isRail ? theme.spacing.md : theme.spacing.xl,
          gap: theme.spacing.xl,
          alignItems: isRail ? "center" : "stretch",
        }}
      >
        <View
          style={{
            paddingTop: theme.spacing.xs,
            flexDirection: isRail ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.md,
          }}
        >
          {isRail ? (
            <BrandMark size={40} tone="dark" />
          ) : (
            <BrandMark size={36} tone="dark" withWordmark subtitle="Restaurant dashboard" />
          )}
          {canExpand ? (
            <Pressable
              onPress={() => setSidebarCollapsed(!isRail)}
              accessibilityRole="button"
              accessibilityLabel={isRail ? "Expand sidebar" : "Collapse sidebar"}
              style={({ hovered, pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: hovered ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon
                name={isRail ? "chevrons-right" : "chevrons-left"}
                size={16}
                color="rgba(255, 255, 255, 0.75)"
              />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={switchRestaurant}
          accessibilityRole="button"
          accessibilityLabel={`${restaurantName}. Switch restaurant`}
          style={({ hovered, pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            backgroundColor: hovered ? "#352D29" : theme.color.surfaceDarkRaised,
            borderRadius: theme.radius.lg,
            padding: isRail ? theme.spacing.sm : theme.spacing.md,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.06)",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.color.textOnDark,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text variant="label">{initials(restaurantName)}</Text>
          </View>
          {isRail ? null : (
            <>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" color="onDark" numberOfLines={1}>
                  {restaurantName}
                </Text>
                {restaurantStreet ? (
                  <Text variant="caption" color="onDark" style={{ opacity: 0.6 }} numberOfLines={1}>
                    {restaurantStreet}
                  </Text>
                ) : null}
              </View>
              <Icon name="repeat" size={15} color="rgba(255, 255, 255, 0.6)" />
            </>
          )}
        </Pressable>

        <View style={{ gap: theme.spacing.xs }}>
          {isRail ? null : (
            <Text
              variant="label"
              color="onDark"
              style={{ opacity: 0.4, letterSpacing: 1, marginBottom: theme.spacing.xs }}
            >
              WORKSPACE
            </Text>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const badge = item.href === "/orders" ? (stats?.active ?? 0) : 0;
            return (
              <Pressable
                key={item.href}
                onPress={() => !isActive && router.replace(item.href)}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isActive }}
                style={({ hovered, pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: isRail ? "center" : "flex-start",
                  gap: theme.spacing.md,
                  width: isRail ? 56 : undefined,
                  height: isRail ? 52 : undefined,
                  backgroundColor: isActive
                    ? theme.color.surfaceDarkRaised
                    : hovered
                      ? "rgba(255, 255, 255, 0.04)"
                      : "transparent",
                  borderRadius: theme.radius.md,
                  paddingVertical: isRail ? 0 : theme.spacing.md,
                  paddingHorizontal: isRail ? 0 : theme.spacing.md,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {isActive ? (
                  <View
                    style={{
                      position: "absolute",
                      left: isRail ? -theme.spacing.md : -theme.spacing.xl,
                      top: 12,
                      bottom: 12,
                      width: 3,
                      borderTopRightRadius: 3,
                      borderBottomRightRadius: 3,
                      backgroundColor: theme.color.gold,
                    }}
                  />
                ) : null}
                <Icon
                  name={item.icon}
                  size={19}
                  color={isActive ? theme.color.gold : "rgba(255, 255, 255, 0.7)"}
                />
                {isRail ? null : (
                  <Text
                    variant="bodyStrong"
                    style={{
                      flex: 1,
                      color: isActive ? theme.color.textOnDark : "rgba(255, 255, 255, 0.75)",
                    }}
                  >
                    {item.label}
                  </Text>
                )}
                {badge > 0 ? <CountBadge count={badge} floating={isRail} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {isRail ? null : (
          <View
            style={{
              backgroundColor: theme.color.surfaceDarkRaised,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              gap: theme.spacing.xs,
              borderWidth: 1,
              borderColor: "rgba(255, 197, 61, 0.18)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
              <Icon name="mc:wallet-outline" size={14} color={theme.color.gold} />
              <Text variant="caption" color="onDark" style={{ opacity: 0.75 }}>
                Today&apos;s payout
              </Text>
            </View>
            <Text variant="title" color="onDark">
              {formatCents(stats?.earnedTodayCents ?? 0)}
            </Text>
            <Text variant="caption" color="onDark" style={{ opacity: 0.55, fontSize: 12 }}>
              Your 95% share · paid out by FoodieDeals
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

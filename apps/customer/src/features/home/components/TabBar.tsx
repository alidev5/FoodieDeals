import { Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { usePathname, useRouter } from "expo-router";
import { Platform, Pressable, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCartStore } from "../../cart/store";
import { useMyOrders } from "../hooks/useCustomerSummary";

type TabHref = "/home" | "/map" | "/orders" | "/favorites" | "/profile";

const TABS: Array<{ href: TabHref; label: string; icon: IconName; matches: string[] }> = [
  { href: "/home", label: "Home", icon: "home", matches: ["/home", "/restaurant"] },
  { href: "/map", label: "Nearby", icon: "map", matches: ["/map"] },
  { href: "/orders", label: "Orders", icon: "mc:receipt", matches: ["/orders", "/pickup"] },
  { href: "/favorites", label: "Saved", icon: "heart", matches: ["/favorites"] },
  { href: "/profile", label: "Profile", icon: "user", matches: ["/profile"] },
];

/** Flows that own the bottom of the screen (onboarding, paying, the receipt) hide the tab bar. */
const HIDDEN_ON = ["/", "/checkout", "/order-success"];

export const TAB_BAR_HEIGHT = 68;
/** Bottom padding for scroll content so the last item clears the floating bar. */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + 48;

const WEB_GLASS = Platform.OS === "web" ? ({ backdropFilter: "blur(18px)" } as ViewStyle) : null;

function isActiveTab(pathname: string, matches: string[]): boolean {
  return matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function TabBar() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { data: orders } = useMyOrders();
  const cartCount = useCartStore((state) =>
    state.cart.lines.reduce((sum, line) => sum + line.quantity, 0),
  );

  if (HIDDEN_ON.includes(pathname)) {
    return null;
  }

  const activeOrders = (orders ?? []).filter((order) => order.status !== "PICKED_UP").length;
  const badges: Partial<Record<TabHref, number>> = { "/orders": activeOrders, "/home": cartCount };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, theme.spacing.md),
        alignItems: "center",
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <View
        accessibilityRole="tablist"
        style={[
          {
            width: "100%",
            maxWidth: 480,
            height: TAB_BAR_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(27, 22, 19, 0.94)",
            borderRadius: theme.radius.xxl,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.08)",
            paddingHorizontal: theme.spacing.xs,
            shadowColor: theme.shadow.card.color,
            shadowOpacity: 0.28,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          },
          WEB_GLASS,
        ]}
      >
        {TABS.map((tab) => {
          const isActive = isActiveTab(pathname, tab.matches);
          const badge = badges[tab.href] ?? 0;
          return (
            <Pressable
              key={tab.href}
              onPress={() => pathname !== tab.href && router.replace(tab.href)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={({ pressed }) => ({
                flex: 1,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? theme.color.gold : "transparent",
                }}
              >
                <Icon
                  name={tab.icon}
                  size={19}
                  color={isActive ? theme.color.surfaceDark : "rgba(255, 255, 255, 0.62)"}
                />
                {badge > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: 2,
                      minWidth: 17,
                      height: 17,
                      borderRadius: 9,
                      paddingHorizontal: 4,
                      backgroundColor: theme.color.accent,
                      borderWidth: 2,
                      borderColor: theme.color.surfaceDark,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text variant="label" color="onDark" style={{ fontSize: 9, lineHeight: 11 }}>
                      {badge > 9 ? "9+" : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                variant="label"
                style={{
                  fontSize: 11,
                  lineHeight: 13,
                  color: isActive ? theme.color.textOnDark : "rgba(255, 255, 255, 0.55)",
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

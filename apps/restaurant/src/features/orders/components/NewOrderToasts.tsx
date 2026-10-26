import { formatCents } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, View } from "react-native";

import { useOrders } from "../hooks/useOrders";
import type { NewOrderAlert } from "../hooks/useOrdersSocket";

const AUTO_DISMISS_MS = 9000;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

function Toast({ alert, onDismiss }: { alert: NewOrderAlert; onDismiss: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { data: orders } = useOrders();
  const order = orders?.find((candidate) => candidate.id === alert.orderId);
  const entrance = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    Animated.timing(countdown, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => finished && onDismissRef.current());
  }, [entrance, countdown]);

  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const detail = order
    ? `${order.pickupName} · ${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatCents(order.totalCents)}`
    : "Paid in app · loading details";

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        width: 360,
        maxWidth: "100%",
        backgroundColor: theme.color.surfaceDark,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: "rgba(255, 197, 61, 0.25)",
        overflow: "hidden",
        shadowColor: theme.shadow.card.color,
        shadowOpacity: 0.35,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 14,
        opacity: entrance,
        transform: [
          { translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) },
        ],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.color.gold,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bell" size={20} color={theme.color.surfaceDark} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading" color="onDark">
            New order #{alert.orderNumber}
          </Text>
          <Text variant="caption" color="onDark" style={{ opacity: 0.7 }} numberOfLines={1}>
            {detail}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: "flex-start" })}
        >
          <Icon name="x" size={16} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <Pressable
          onPress={() => {
            onDismiss();
            router.replace(`/orders?orderId=${alert.orderId}`);
          }}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.xs,
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            paddingVertical: theme.spacing.sm + 2,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text variant="bodyStrong" color="onDark">
            Open order
          </Text>
          <Icon name="arrow-right" size={15} color={theme.color.textOnDark} />
        </Pressable>
      </View>
      <Animated.View
        style={{
          height: 3,
          backgroundColor: theme.color.gold,
          width: countdown.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </Animated.View>
  );
}

export interface NewOrderToastsProps {
  alerts: NewOrderAlert[];
  onDismiss: (orderId: string) => void;
}

export function NewOrderToasts({ alerts, onDismiss }: NewOrderToastsProps) {
  const theme = useTheme();
  const pathname = usePathname();

  if (alerts.length === 0 || pathname === "/") {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: theme.spacing.xl,
        right: theme.spacing.xl,
        left: theme.spacing.xl,
        alignItems: "flex-end",
        gap: theme.spacing.md,
      }}
    >
      {alerts.map((alert) => (
        <Toast key={alert.orderId} alert={alert} onDismiss={() => onDismiss(alert.orderId)} />
      ))}
    </View>
  );
}

import { formatCents } from "@foodiedeals/shared";
import {
  Button,
  Card,
  Icon,
  LoadingState,
  SuccessCheck,
  Text,
  useTheme,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatClockTime } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { useOrder } from "../../orders/hooks/useOrder";

export interface OrderSuccessScreenProps {
  orderId: string | undefined;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: "user" | "clock" | "credit-card";
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.color.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={16} />
      </View>
      <Text variant="body" color="secondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

export function OrderSuccessScreen({ orderId }: OrderSuccessScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: order } = useOrder(orderId);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
        <LoadingState message="Finalizing your order" />
      </SafeAreaView>
    );
  }

  const prepMinutes = order.restaurant.prepMinutesMax ?? order.restaurant.prepMinutesMin ?? 15;
  const readyBy = new Date(new Date(order.createdAt).getTime() + prepMinutes * 60_000);
  const photo = resolveFoodPhoto(order.restaurant.heroPhoto ?? undefined);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.lg,
          alignItems: "stretch",
        }}
      >
        <View style={{ alignItems: "center", gap: theme.spacing.xs, marginTop: theme.spacing.lg }}>
          <SuccessCheck size={96} />
          <Text variant="display" style={{ textAlign: "center" }}>
            Order placed
          </Text>
          <Text variant="body" color="secondary" style={{ textAlign: "center" }}>
            Paid {formatCents(order.totalCents)} · the kitchen has your order
          </Text>
        </View>

        <Card variant="dark" style={{ gap: theme.spacing.md }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text variant="caption" color="onDark" style={{ opacity: 0.7 }}>
              ORDER NUMBER
            </Text>
            <View
              style={{
                backgroundColor: theme.color.gold,
                borderRadius: theme.radius.pill,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 2,
              }}
            >
              <Text variant="label">Waiting</Text>
            </View>
          </View>
          <Text variant="display" color="onDark" style={{ fontSize: 48, lineHeight: 52 }}>
            #{order.orderNumber}
          </Text>
          <Text variant="body" color="onDark" style={{ opacity: 0.75 }}>
            Say &ldquo;{order.pickupName}&rdquo; at the counter.
          </Text>
        </Card>

        <Card style={{ gap: theme.spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: theme.radius.sm,
                overflow: "hidden",
                backgroundColor: theme.color.surfaceMuted,
              }}
            >
              {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{order.restaurant.name}</Text>
              <Text variant="caption" color="tertiary" numberOfLines={1}>
                {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                {order.items.map((item) => item.name).join(", ")}
              </Text>
            </View>
          </View>
          <DetailRow icon="user" label="Pickup name" value={order.pickupName} />
          <DetailRow icon="clock" label="Ready around" value={formatClockTime(readyBy)} />
          <DetailRow icon="credit-card" label="Paid in app" value={formatCents(order.totalCents)} />
          {order.discountCents > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                backgroundColor: theme.color.successSoft,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              }}
            >
              <Icon name="gift" size={16} color={theme.color.success} />
              <Text variant="bodyStrong" color="success" style={{ flex: 1 }}>
                You saved {formatCents(order.discountCents)} on this order
              </Text>
            </View>
          ) : null}
        </Card>

        <Button
          label="Track my order"
          icon="navigation"
          variant="accent"
          size="lg"
          onPress={() => router.replace(`/pickup?orderId=${order.id}`)}
        />
        <Button label="Back to home" variant="ghost" onPress={() => router.replace("/home")} />
      </ScrollView>
    </SafeAreaView>
  );
}

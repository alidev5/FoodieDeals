import { formatCents, nextAction, SALES_TAX_RATE, type OrderStatus } from "@foodiedeals/shared";
import {
  Button,
  Icon,
  OrderStatusBadge,
  resolveFoodPhoto,
  Text,
  useTheme,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { ScrollView, View } from "react-native";

import type { RestaurantOrder } from "../../../lib/restaurantApi";
import { clockTime } from "../format";

export interface OrderDetailPanelProps {
  order: RestaurantOrder | null;
  onAdvance: (orderId: string) => void;
  prepMinutes?: number;
  /** Menu photo filenames keyed by menu item id, for the item thumbnails. */
  menuPhotos?: Record<string, string | undefined>;
  /** False when the panel sits inside a page that already scrolls (stacked layout). */
  scrollable?: boolean;
}

const ACTION_BUTTON_LABEL: Record<OrderStatus, string | null> = {
  WAITING: "Accept order",
  ACCEPTED: "Mark ready",
  READY: "Mark picked up",
  PICKED_UP: null,
};

const STEPS = ["Accept", "Mark ready", "Picked up"] as const;
const COMPLETED_STEPS: Record<OrderStatus, number> = {
  WAITING: 0,
  ACCEPTED: 1,
  READY: 2,
  PICKED_UP: 3,
};

function Row({
  label,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text
        variant={strong ? "heading" : "body"}
        color={accent ? "accent" : strong ? "primary" : "secondary"}
      >
        {label}
      </Text>
      <Text variant={strong ? "title" : "bodyStrong"} color={accent ? "accent" : "primary"}>
        {value}
      </Text>
    </View>
  );
}

export function OrderDetailPanel({
  order,
  onAdvance,
  prepMinutes,
  menuPhotos = {},
  scrollable = true,
}: OrderDetailPanelProps) {
  const theme = useTheme();

  if (!order) {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 280,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.sm,
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.xxl,
          borderWidth: 1,
          borderColor: theme.color.line,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.color.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="inbox" size={26} color={theme.color.textTertiary} />
        </View>
        <Text variant="heading">No order selected</Text>
        <Text variant="body" color="tertiary">
          Pick an order from the list to see its details.
        </Text>
      </View>
    );
  }

  const action = nextAction(order.status);
  const buttonLabel = ACTION_BUTTON_LABEL[order.status];
  const completed = COMPLETED_STEPS[order.status];
  const readyBy = prepMinutes
    ? new Date(new Date(order.acceptedAt ?? order.createdAt).getTime() + prepMinutes * 60_000)
    : null;
  const pickupLine = order.readyAt
    ? `Ready since ${clockTime(order.readyAt)}`
    : readyBy
      ? `Pickup ASAP · ready by ~${clockTime(readyBy)}`
      : "Pickup ASAP";

  return (
    <View
      style={{
        flex: scrollable ? 1 : undefined,
        minWidth: 0,
        minHeight: 0,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
        borderColor: theme.color.line,
        overflow: "hidden",
        shadowColor: theme.shadow.card.color,
        shadowOpacity: theme.shadow.card.opacity,
        shadowRadius: theme.shadow.card.radius,
        shadowOffset: { width: 0, height: theme.shadow.card.offsetY },
      }}
    >
      <ScrollView
        scrollEnabled={scrollable}
        style={{ flex: scrollable ? 1 : undefined }}
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" color="accent">
              ORDER #{order.orderNumber} · {clockTime(order.createdAt).toUpperCase()}
            </Text>
            <Text variant="display">{order.pickupName}</Text>
            <Text variant="body" color="tertiary">
              {pickupLine}
            </Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.color.line,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.md,
          }}
        >
          {order.items.map((item) => (
            <View
              key={item.menuItemId ?? item.name}
              style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: theme.radius.md,
                  overflow: "hidden",
                  backgroundColor: theme.color.surfaceMuted,
                }}
              >
                {resolveFoodPhoto(menuPhotos[item.menuItemId]) ? (
                  <Image
                    source={resolveFoodPhoto(menuPhotos[item.menuItemId])}
                    style={{ flex: 1 }}
                    contentFit="cover"
                  />
                ) : null}
              </View>
              <View
                style={{
                  backgroundColor: theme.color.surfaceMuted,
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 2,
                }}
              >
                <Text variant="label">{item.quantity}×</Text>
              </View>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {item.name}
              </Text>
              <Text variant="body" color="secondary">
                {formatCents(item.priceCents * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
          {order.discountCents > 0 ? (
            <Row
              label={`Deal · ${order.appliedDealName ?? "applied"}`}
              value={`-${formatCents(order.discountCents)}`}
              accent
            />
          ) : null}
          <Row
            label={`NY sales tax (${(SALES_TAX_RATE * 100).toFixed(3)}%)`}
            value={formatCents(order.taxCents)}
          />
          <Row label="Paid in app" value={formatCents(order.totalCents)} strong />
        </View>

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
          <Icon name="credit-card" size={16} color={theme.color.success} />
          <Text variant="bodyStrong" color="success" style={{ flex: 1 }}>
            You receive {formatCents(order.restaurantReceivesCents)}
            {order.paidOutAt ? " · paid out" : " · payout pending"}
          </Text>
          <Text variant="caption" color="success">
            FoodieDeals fee (5%) {formatCents(order.platformFeeCents)}
          </Text>
        </View>
      </ScrollView>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.color.line,
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.md,
          backgroundColor: theme.color.surface,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          {STEPS.flatMap((step, index) => {
            const isDone = index < completed;
            const isCurrent = index === completed;
            const marker = (
              <View
                key={step}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                  flexShrink: 0,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDone
                      ? theme.color.surfaceDark
                      : isCurrent
                        ? theme.color.accent
                        : theme.color.surfaceMuted,
                  }}
                >
                  {isDone ? (
                    <Icon name="check" size={14} color={theme.color.textOnDark} />
                  ) : (
                    <Text
                      variant="label"
                      style={{
                        color: isCurrent ? theme.color.textOnDark : theme.color.textTertiary,
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text variant="caption" color={isCurrent || isDone ? "primary" : "tertiary"}>
                  {step}
                </Text>
              </View>
            );
            if (index === STEPS.length - 1) {
              return [marker];
            }
            return [
              marker,
              <View
                key={`${step}-connector`}
                style={{
                  flex: 1,
                  minWidth: 12,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: isDone ? theme.color.surfaceDark : theme.color.line,
                }}
              />,
            ];
          })}
        </View>

        {action && buttonLabel ? (
          <Button
            label={buttonLabel}
            icon="check"
            variant="accent"
            size="lg"
            onPress={() => onAdvance(order.id)}
          />
        ) : (
          <Button
            label="Picked up"
            icon="check-circle"
            variant="muted"
            size="lg"
            disabled
            onPress={() => undefined}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.xs,
          }}
        >
          <Icon name="zap" size={13} color={theme.color.textTertiary} />
          <Text variant="caption" color="tertiary">
            {order.pickupName.split(" ")[0]}'s pickup screen updates instantly when you tap
          </Text>
        </View>
      </View>
    </View>
  );
}

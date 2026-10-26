import type { OrderStatus } from "@foodiedeals/shared";

import { Badge, type BadgeTone } from "./Badge";

const STATUS_DISPLAY: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  WAITING: { label: "Waiting", tone: "goldSoft" },
  ACCEPTED: { label: "Preparing", tone: "accent" },
  READY: { label: "Ready", tone: "success" },
  PICKED_UP: { label: "Picked up", tone: "muted" },
};

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { label, tone } = STATUS_DISPLAY[status];
  return <Badge label={label} tone={tone} dot />;
}

export const ORDER_STATUSES = ["WAITING", "ACCEPTED", "READY", "PICKED_UP"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

interface TransitionRule {
  next: OrderStatus;
  actionLabel: string;
}

const TRANSITIONS: Record<OrderStatus, TransitionRule | null> = {
  WAITING: { next: "ACCEPTED", actionLabel: "Accept" },
  ACCEPTED: { next: "READY", actionLabel: "Mark ready" },
  READY: { next: "PICKED_UP", actionLabel: "Picked up" },
  PICKED_UP: null,
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.next === to;
}

export interface NextAction {
  label: string;
  next: OrderStatus;
}

export function nextAction(status: OrderStatus): NextAction | null {
  const rule = TRANSITIONS[status];
  return rule ? { label: rule.actionLabel, next: rule.next } : null;
}

export type CustomerStepState = "done" | "active" | "upcoming";

export interface CustomerStep {
  key: "waiting" | "accepted" | "preparing" | "ready";
  label: string;
  state: CustomerStepState;
}

const STEP_DEFINITIONS: Array<{ key: CustomerStep["key"]; label: string }> = [
  { key: "waiting", label: "Waiting" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
];

const ACTIVE_STEP_INDEX: Record<OrderStatus, number> = {
  WAITING: 0,
  ACCEPTED: 2,
  READY: 3,
  PICKED_UP: 3,
};

export function toCustomerSteps(status: OrderStatus): CustomerStep[] {
  const activeIndex = ACTIVE_STEP_INDEX[status];
  const allDone = status === "PICKED_UP";

  return STEP_DEFINITIONS.map((definition, index) => {
    let state: CustomerStepState;
    if (allDone || index < activeIndex) {
      state = "done";
    } else if (index === activeIndex) {
      state = "active";
    } else {
      state = "upcoming";
    }
    return { ...definition, state };
  });
}

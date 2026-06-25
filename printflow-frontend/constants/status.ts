export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "printing",
  "ready",
  "collected",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES: OrderStatusValue[] = ["pending", "accepted", "printing"];
export const COMPLETE_ORDER_STATUSES: OrderStatusValue[] = ["ready", "collected"];

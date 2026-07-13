import type { Protein } from "@fortifykitchen/types";

const PROTEIN_OPTIONS: Protein[] = ["CHICKEN", "BEEF", "SHRIMP"];
const PAYMENT_STATE_OPTIONS = ["UNPAID", "DEPOSIT", "PAID"] as const;
// Unified Shopee-style order status — shared by one-off orders and
// subscription-generated orders alike (see OrderStatus in
// @fortifykitchen/types). ORDER_STATUS_LABELS (imported above from
// packages/shared) has the Vietnamese display strings for each.
const ORDER_STATUS_OPTIONS = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;
// Badge color per status — used everywhere an order/subscription-order row
// renders its current status (Orders tab, Orders from Subscriptions,
// dashboard recent orders, order detail modal).
const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export { PROTEIN_OPTIONS, PAYMENT_STATE_OPTIONS, ORDER_STATUS_OPTIONS, ORDER_STATUS_BADGE_CLASS };

import type { OrderStatus, OrderFulfillmentType, PaymentState, Protein, CustomPlanRequestStatus } from "@fortifykitchen/types";

export const PROTEIN_LABELS: Record<Protein, string> = {
  CHICKEN: "Gà",
  BEEF: "Bò",
  SHRIMP: "Tôm",
};

export const PROTEIN_OPTIONS: Protein[] = ["CHICKEN", "BEEF", "SHRIMP"];

/**
 * Human display label for a menu item / line item, e.g. "Gà xá xíu (150g)".
 * Ported from the original app's getMenuItemLabel() — used anywhere a
 * protein+flavor+size combination needs a single readable string (order
 * line items, subscription templates, the customer storefront menu grid).
 */
export function getMenuItemLabel(item: { protein: Protein; flavor: string; sizeGrams: number }): string {
  const proteinLabel = PROTEIN_LABELS[item.protein] || item.protein;
  return `${proteinLabel} ${item.flavor} (${item.sizeGrams}g)`;
}

/**
 * Display labels for the Prisma PaymentState enum — the original app stored
 * the Vietnamese string directly as the value ("Chưa thanh toán" etc); the
 * new schema stores a stable English enum (UNPAID/DEPOSIT/PAID) instead, so
 * the UI looks these up for display.
 */
export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  UNPAID: "Chưa thanh toán",
  DEPOSIT: "Đã cọc",
  PAID: "Đã thanh toán",
};

export const PAYMENT_STATES: PaymentState[] = ["UNPAID", "DEPOSIT", "PAID"];
export const PAYMENT_STATE_OPTIONS = ["UNPAID", "DEPOSIT", "PAID"] as const;

/**
 * Unified order status labels (Vietnamese) — shared by one-off orders and
 * subscription-generated orders alike, modeled on a Shopee-style flow. See
 * OrderStatus in @fortifykitchen/types.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  OUT_FOR_DELIVERY: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_STATUS_OPTIONS = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

// Statuses that still count as "in flight" — not yet finished and not
// cancelled. Used to scope the admin "current" view and the customer-web
// "upcoming" list.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
];

/**
 * Labels for OrderFulfillmentType — IMMEDIATE means every line item was
 * covered by ready stock (no prep needed, decremented at order time);
 * SCHEDULED means at least one item needs the kitchen to prep it.
 */
export const FULFILLMENT_TYPE_LABELS: Record<OrderFulfillmentType, string> = {
  IMMEDIATE: "Có sẵn — giao ngay",
  SCHEDULED: "Cần chuẩn bị",
};

export const ORDER_FULFILLMENT_TYPE_LABELS = FULFILLMENT_TYPE_LABELS;

/**
 * Custom Plan Request lifecycle — customer submits (PENDING), staff
 * consults and either annotates it (REVIEWED), links it to a real
 * Subscription (MATCHED — set automatically when a Subscription is created
 * with this request's id), or turns it down (DECLINED).
 */
export const CUSTOM_PLAN_REQUEST_STATUS_OPTIONS: CustomPlanRequestStatus[] = ["PENDING", "REVIEWED", "MATCHED", "DECLINED"];
export const CUSTOM_PLAN_REQUEST_STATUS_LABELS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "Chờ tư vấn",
  REVIEWED: "Đã xem xét",
  MATCHED: "Đã ghép gói",
  DECLINED: "Từ chối",
};
export const CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-200",
  MATCHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
};

/**
 * Subscription scheduling model.
 *
 * A subscription has two independent settings:
 *  - planDurationDays: how long the package runs in total (e.g. a "monthly"
 *    package = 30 days).
 *  - deliveryIntervalDays: how often a delivery happens within that span
 *    (e.g. every day = 1, every week = 7).
 *
 * The number of deliveries generated is derived from the two:
 *   deliveries = floor(planDurationDays / deliveryIntervalDays), min 1.
 *
 * Example: a monthly (30-day) plan delivered daily (every 1 day) generates
 * 30 deliveries, one per day. A weekly (7-day) plan delivered weekly
 * (every 7 days) generates 1 delivery. A monthly plan delivered weekly
 * generates 4.
 */
export const PLAN_DURATION_PRESETS = [
  { days: 7, label: "Gói tuần (7 ngày)" },
  { days: 14, label: "Gói 2 tuần (14 ngày)" },
  { days: 30, label: "Gói tháng (30 ngày)" },
  { days: 90, label: "Gói quý (90 ngày)" },
] as const;

export const DELIVERY_FREQUENCY_PRESETS = [
  { days: 1, label: "Hàng ngày (mỗi 1 ngày)" },
  { days: 2, label: "Mỗi 2 ngày" },
  { days: 3, label: "Mỗi 3 ngày" },
  { days: 7, label: "Hàng tuần (mỗi 7 ngày)" },
  { days: 14, label: "Mỗi 2 tuần" },
  { days: 30, label: "Hàng tháng (mỗi 30 ngày)" },
] as const;

/**
 * Human label for an arbitrary interval in days, falling back to
 * "Mỗi N ngày" for values with no dedicated preset (e.g. a custom 4-day
 * interval typed in by the user).
 */
export function formatIntervalLabel(days: number): string {
  if (days === 1) return "Hàng ngày";
  if (days === 7) return "Hàng tuần";
  if (days === 14) return "Mỗi 2 tuần";
  if (days === 30) return "Hàng tháng";
  return `Mỗi ${days} ngày`;
}

/** Human label for an arbitrary plan duration in days. */
export function formatDurationLabel(days: number): string {
  if (days === 7) return "Gói tuần (7 ngày)";
  if (days === 14) return "Gói 2 tuần (14 ngày)";
  if (days === 30) return "Gói tháng (30 ngày)";
  if (days === 90) return "Gói quý (90 ngày)";
  return `Gói ${days} ngày`;
}

/** Number of deliveries a plan duration + delivery interval produces. */
export function computeDeliveryCount(
  planDurationDays: number,
  deliveryIntervalDays: number,
): number {
  if (!planDurationDays || !deliveryIntervalDays || deliveryIntervalDays <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(planDurationDays / deliveryIntervalDays));
}

/**
 * Given a start date, delivery interval, and number of deliveries, compute
 * the ISO scheduled dates for the whole run — the same generation logic the
 * original app used inline in SubscriptionsPage's handleCreate. Centralized
 * here so the API (which actually creates the Order rows) and any
 * frontend preview use identical math.
 */
export function generateDeliveryDates(
  startDate: Date | string,
  deliveryIntervalDays: number,
  deliveriesPlanned: number,
): string[] {
  const start = new Date(startDate);
  const dates: string[] = [];
  for (let i = 0; i < deliveriesPlanned; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * deliveryIntervalDays);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

/** The last scheduled delivery date for a plan — startDate + (n-1) * interval. */
export function computeScheduleEndDate(
  startDate: Date | string,
  deliveryIntervalDays: number,
  deliveriesPlanned: number,
): string | null {
  if (deliveriesPlanned <= 0) return null;
  const d = new Date(startDate);
  d.setDate(d.getDate() + (deliveriesPlanned - 1) * deliveryIntervalDays);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------
// Volume-based subscription scheduling
//
// A volume subscription doesn't fix a plan duration or delivery count up
// front — the customer buys a total WEIGHT (across one or more protein
// pools) and picks a cadence (deliveryAmountGrams delivered every
// deliveryIntervalDays). The number of deliveries falls out of dividing
// the total by the per-delivery amount, with the LAST delivery taking
// whatever remainder is left (never requiring an even split).
// ---------------------------------------------------------------------

export const DELIVERY_AMOUNT_PRESETS_GRAMS = [500, 1000, 2000, 3000, 5000] as const;

export interface VolumeScheduleEntry {
  index: number;
  date: string; // YYYY-MM-DD
  grams: number; // target weight for this occurrence (last one = remainder)
}

/**
 * Theoretical full schedule for a volume subscription — every occurrence
 * from startDate until the total weight is exhausted, one entry per
 * deliveryIntervalDays. Purely a projection/preview: the API only ever
 * materializes real Order rows for occurrences landing within the next
 * 7 days (see SubscriptionsService.syncUpcomingOrders), and after a
 * postpone the *actual* on-disk dates diverge from this projection (which
 * assumes no postpones) — this is for up-front previewing at creation time
 * and for display estimates only.
 */
export function generateVolumeSchedule(
  startDate: Date | string,
  deliveryAmountGrams: number,
  deliveryIntervalDays: number,
  totalGrams: number,
): VolumeScheduleEntry[] {
  if (
    !deliveryAmountGrams ||
    deliveryAmountGrams <= 0 ||
    !deliveryIntervalDays ||
    deliveryIntervalDays <= 0 ||
    !totalGrams ||
    totalGrams <= 0
  ) {
    return [];
  }

  const entries: VolumeScheduleEntry[] = [];
  const start = new Date(startDate);
  let remaining = totalGrams;
  let i = 0;
  // Safety guard against pathological inputs (e.g. deliveryAmountGrams = 1
  // against a multi-kg total) generating an unbounded loop.
  const MAX_ENTRIES = 2000;

  while (remaining > 0 && i < MAX_ENTRIES) {
    const grams = Math.min(deliveryAmountGrams, remaining);
    const d = new Date(start);
    d.setDate(d.getDate() + i * deliveryIntervalDays);
    entries.push({ index: i, date: d.toISOString().split("T")[0], grams });
    remaining -= grams;
    i += 1;
  }

  return entries;
}

/** Add N days to a date, returning a new Date (does not mutate the input). */
export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

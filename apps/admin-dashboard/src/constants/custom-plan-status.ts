import type { CustomPlanRequestStatus } from "@fortifykitchen/types";

// Custom Plan Request lifecycle — customer submits (PENDING), staff
// consults and either annotates it (REVIEWED), links it to a real
// Subscription (MATCHED — set automatically when a Subscription is created
// with this request's id), or turns it down (DECLINED).
const CUSTOM_PLAN_REQUEST_STATUS_OPTIONS: CustomPlanRequestStatus[] = ["PENDING", "REVIEWED", "MATCHED", "DECLINED"];
const CUSTOM_PLAN_REQUEST_STATUS_LABELS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "Chờ tư vấn",
  REVIEWED: "Đã xem xét",
  MATCHED: "Đã ghép gói",
  DECLINED: "Từ chối",
};
const CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-200",
  MATCHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
};

export { CUSTOM_PLAN_REQUEST_STATUS_OPTIONS, CUSTOM_PLAN_REQUEST_STATUS_LABELS, CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS };

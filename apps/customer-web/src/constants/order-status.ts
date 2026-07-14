export const ORDER_STATUS_LABELS: Record<"vi" | "en", Record<string, string>> = {
  vi: {
    PENDING_CONFIRMATION: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    OUT_FOR_DELIVERY: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã huỷ",
  },
  en: {
    PENDING_CONFIRMATION: "Awaiting confirmation",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    OUT_FOR_DELIVERY: "Out for delivery",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
};

export const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export const PROTEIN_LABELS: Record<string, string> = {
  CHICKEN: "Gà",
  BEEF: "Bò",
  SHRIMP: "Tôm",
  PORK: "Heo",
  FISH: "Cá",
  VEGAN: "Chay",
};

export const PROTEIN_OPTIONS = [
  { id: "chicken", label: "Ức gà (Chicken)" },
  { id: "beef", label: "Thịt bò (Beef)" },
  { id: "shrimp", label: "Tôm thẻ (Shrimp)" },
] as const;

export const CARB_OPTIONS = [
  { id: "rice", label: "Gạo lứt (Brown Rice)" },
  { id: "potato", label: "Khoai lang (Sweet Potato)" },
  { id: "noodle", label: "Bún lứt (Brown Rice Noodles)" },
] as const;

export const TOPPING_OPTIONS = [
  { id: "broccoli", label: "Bông cải xanh (Broccoli)" },
  { id: "egg", label: "Trứng luộc (Boiled Egg)" },
  { id: "mushroom", label: "Nấm hương (Shiitake)" },
] as const;

export const SAUCE_OPTIONS = [
  { id: "sesame", label: "Xốt mè rang (Sesame)" },
  { id: "citrus", label: "Xốt cam chua ngọt (Citrus)" },
  { id: "spicy", label: "Xốt tương cay (Spicy Soy)" },
] as const;

export const ORDER_HISTORY_STATUS_GROUPS = [
  { key: "all", vi: "Tất cả", en: "All", statuses: null },
  { key: "active", vi: "Đang xử lý", en: "Processing", statuses: ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] },
  { key: "completed", vi: "Hoàn thành", en: "Completed", statuses: ["COMPLETED"] },
  { key: "cancelled", vi: "Đã huỷ", en: "Cancelled", statuses: ["CANCELLED"] },
] as const;
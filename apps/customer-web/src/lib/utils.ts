"use client";

import type { Protein, MenuItem } from "@fortifykitchen/types";
import { faWallet, faTag, faGift, faUtensils, faMagic } from "@fortawesome/free-solid-svg-icons";

const PROTEIN_OPTIONS = [
  {
    id: "chicken",
    label: "Ức gà (Chicken)",
    sizes: {
      150: { pro: 37, carb: 0, fat: 3, kcal: 175, price: 25000 },
      250: { pro: 61, carb: 0, fat: 5, kcal: 290, price: 42000 },
    },
  },
  {
    id: "beef",
    label: "Thịt bò (Beef)",
    sizes: {
      150: { pro: 35, carb: 0, fat: 12, kcal: 250, price: 50000 },
    },
  },
  {
    id: "shrimp",
    label: "Tôm thẻ (Shrimp)",
    sizes: {
      150: { pro: 32, carb: 0, fat: 2, kcal: 150, price: 50000 },
    },
  },
];

const CARB_OPTIONS = [
  { id: "rice", label: "Gạo lứt (Brown Rice)", pro: 4, carb: 45, fat: 1.5, kcal: 210, price: 10000 },
  { id: "potato", label: "Khoai lang (Sweet Potato)", pro: 2, carb: 26, fat: 0.2, kcal: 115, price: 12000 },
  { id: "noodle", label: "Bún lứt (Brown Rice Noodles)", pro: 3, carb: 40, fat: 1, kcal: 180, price: 10000 },
];

const TOPPING_OPTIONS = [
  { id: "broccoli", label: "Bông cải xanh (Broccoli)", pro: 2.5, carb: 6, fat: 0.3, kcal: 35, price: 5000 },
  { id: "egg", label: "Trứng luộc (Boiled Egg)", pro: 6, carb: 0.6, fat: 5, kcal: 70, price: 8000 },
  { id: "mushroom", label: "Nấm hương (Shiitake)", pro: 2, carb: 5, fat: 0.2, kcal: 30, price: 7000 },
];

const SAUCE_OPTIONS = [
  { id: "sesame", label: "Xốt mè rang (Sesame)", pro: 1, carb: 5, fat: 6, kcal: 78, price: 5000 },
  { id: "citrus", label: "Xốt cam chua ngọt (Citrus)", pro: 0, carb: 10, fat: 0, kcal: 40, price: 5000 },
  { id: "spicy", label: "Xốt tương cay (Spicy Soy)", pro: 0.5, carb: 4, fat: 0.5, kcal: 22, price: 5000 },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " đ";
}

export function translateApiError(
  rawMessage: string | string[] | undefined,
  lang: "vi" | "en",
  fallback: string
): string {
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  if (lang === "en") {
    return message || fallback;
  }
  if (message) {
    const KNOWN_ERROR_TRANSLATIONS: { match: RegExp; vi: string }[] = [
      { match: /wallet balance is insufficient/i, vi: "Số dư Ví của bạn không đủ để thanh toán khoản này." },
      { match: /invalid email or password/i, vi: "Email hoặc mật khẩu không đúng." },
      { match: /email already registered/i, vi: "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác." },
      { match: /no customer profile found/i, vi: "Không tìm thấy hồ sơ khách hàng cho tài khoản này." },
      { match: /already paid/i, vi: "Gói này đã được thanh toán rồi." },
      { match: /no linked customer to charge/i, vi: "Gói này chưa được gắn với khách hàng nào." },
      { match: /stock .* changed before/i, vi: "Một món trong đơn đã hết hàng ngay lúc bạn đặt — vui lòng thử lại." },
      { match: /subscription plan .* not found/i, vi: "Gói trả trước này hiện không khả dụng." },
      { match: /discount code ".*" not found/i, vi: "Không tìm thấy mã giảm giá này." },
      { match: /discount code ".*" is no longer active/i, vi: "Mã giảm giá này không còn hiệu lực." },
      { match: /discount code ".*" is not valid at this time/i, vi: "Mã giảm giá này chưa hoặc đã hết hạn sử dụng." },
      { match: /discount code ".*" is not valid for your account/i, vi: "Mã giảm giá này không áp dụng cho tài khoản của bạn." },
      { match: /discount code ".*" has already been used/i, vi: "Bạn đã sử dụng mã giảm giá này rồi." },
      {
        match: /you already have an active plan discount/i,
        vi: "Bạn đang có ưu đãi từ gói hiện tại. Vui lòng liên hệ đội ngũ Fortify Kitchen để nâng cấp gói.",
      },
    ];
    const known = KNOWN_ERROR_TRANSLATIONS.find((k) => k.match.test(message));
    if (known) return known.vi;
  }
  return fallback;
}

export function getPlanBenefits(
  voucherPercent: number,
  lang: "vi" | "en"
): { icon: typeof faWallet; text: string }[] {
  const benefits: { icon: typeof faWallet; text: string }[] = [
    {
      icon: faWallet,
      text:
        lang === "vi"
          ? "Nạp bao nhiêu là có bấy nhiêu trong ví, dùng thoải mái cho mọi đơn hàng."
          : "Top up any amount and get the exact same credit in your wallet to spend however you like.",
    },
    {
      icon: faTag,
      text:
        lang === "vi"
          ? `Mọi đơn hàng tự động giảm ${voucherPercent}%, không cần nhớ mã giảm giá.`
          : `Every order is automatically ${voucherPercent}% off — no code to remember.`,
    },
  ];
  if (voucherPercent >= 5) {
    benefits.push({
      icon: faGift,
      text:
        lang === "vi"
          ? "Tặng kèm 1 món ăn miễn phí mỗi tháng (áp dụng cho gói 5% trở lên)."
          : "Get 1 free meal item per month (for 5%+ plans).",
    });
  }
  if (voucherPercent >= 10) {
    benefits.push({
      icon: faUtensils,
      text:
        lang === "vi"
          ? "Ưu tiên xử lý đơn hàng, giao trước giờ cao điểm."
          : "Priority order processing, delivered before peak hours.",
    });
  }
  if (voucherPercent >= 15) {
    benefits.push({
      icon: faMagic,
      text:
        lang === "vi"
          ? "Hỗ trợ tư vấn dinh dưỡng 1-1 hàng tháng từ chuyên gia Fortify."
          : "Monthly 1-on-1 nutrition coaching from Fortify experts.",
    });
  }
  if (voucherPercent >= 20) {
    benefits.push({
      icon: faMagic,
      text:
        lang === "vi"
          ? "Miễn phí hoàn toàn phí giao hàng trọn đời."
          : "Lifetime free delivery on all orders.",
    });
  }
  return benefits;
}

export function groupByFlavor(items: MenuItem[]) {
  const map = new Map<string, { protein: Protein; flavor: string; sizes: MenuItem[] }>();
  for (const item of items) {
    const key = `${item.protein}::${item.flavor}`;
    if (!map.has(key)) map.set(key, { protein: item.protein, flavor: item.flavor, sizes: [] });
    map.get(key)!.sizes.push(item);
  }
  for (const dish of map.values()) {
    dish.sizes.sort((a, b) => a.sizeGrams - b.sizeGrams);
  }
  return Array.from(map.values()).sort((a, b) => a.flavor.localeCompare(b.flavor));
}

export function getSelectedSize(
  dish: { protein: Protein; flavor: string; sizes: MenuItem[] },
  selectedSizeByDish: Record<string, string>
): MenuItem {
  const key = `${dish.protein}::${dish.flavor}`;
  const selectedId = selectedSizeByDish[key];
  return dish.sizes.find((s) => s.id === selectedId) ?? dish.sizes[0];
}

export function calculateCustomOrderPrice(
  customOrderProtein: string,
  customOrderSize: number,
  customOrderCarb: string,
  customOrderSauce: string,
  customOrderToppings: string[]
): number {
  const pOpt = PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein) || PROTEIN_OPTIONS[0];
  const p = pOpt.sizes[customOrderSize as 150 | 250] || pOpt.sizes[150];
  const c = CARB_OPTIONS.find((x) => x.id === customOrderCarb) || CARB_OPTIONS[0];
  const s = SAUCE_OPTIONS.find((x) => x.id === customOrderSauce) || SAUCE_OPTIONS[0];
  let priceVal = 10000 + p.price + c.price + s.price;

  for (const t of customOrderToppings) {
    const topOpt = TOPPING_OPTIONS.find((x) => x.id === t);
    if (topOpt) priceVal += topOpt.price;
  }

  return priceVal;
}
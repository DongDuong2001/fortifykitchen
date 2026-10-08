// Food composition database for the nutrition tracker.
//
// Values are per 100 g (or 100 ml for drinks) and are approximations based
// on USDA FoodData Central (SR Legacy) for single ingredients. Mixed
// Vietnamese dishes (phở, bánh mì, cơm tấm…) are estimates from typical
// recipes, so they carry `estimate: true` and are shown as such in the UI.
// Fortify protein macros follow the macros printed on our own labels.

import type { MenuItem } from "@fortifykitchen/types";
import type { Nutrients } from "./nutrients";

export type FoodCategory = "fortify" | "dishes" | "grains" | "protein" | "veg" | "fruit" | "dairy" | "extras";

export const FOOD_CATEGORIES: { id: FoodCategory; vi: string; en: string }[] = [
  { id: "fortify", vi: "Fortify Kitchen", en: "Fortify Kitchen" },
  { id: "dishes", vi: "Món Việt", en: "Vietnamese dishes" },
  { id: "grains", vi: "Tinh bột", en: "Grains & starch" },
  { id: "protein", vi: "Thịt, cá, trứng, đậu", en: "Meat, fish, eggs, tofu" },
  { id: "veg", vi: "Rau củ", en: "Vegetables" },
  { id: "fruit", vi: "Trái cây", en: "Fruit" },
  { id: "dairy", vi: "Sữa & đồ uống", en: "Dairy & drinks" },
  { id: "extras", vi: "Hạt, dầu, gia vị", en: "Nuts, oils, condiments" },
];

export interface Serving {
  vi: string;
  en: string;
  grams: number;
}

/** Present when the food is on the coach's list (docs/coach-food-list.md). */
export interface CoachInfo {
  /** Item number in the coach's list, or "extra" for the "Phần thêm" foods. */
  ref: number | "extra";
  /** Brand the coach named (e.g. Pendleton, Dalahouse). */
  brand?: string;
  /** Preparation note from the coach (e.g. "đông lạnh", "nấu chín"). */
  note?: string;
  /** Benefit in the coach's own words; only set where the coach gave one. */
  benefit?: string;
}

export interface Food {
  id: string;
  category: FoodCategory;
  vi: string;
  en: string;
  per100: Nutrients;
  servings: Serving[];
  estimate?: boolean;
  coach?: CoachInfo;
}

// Column order for the compact rows below — keep in sync with `n()`.
// kcal, protein, carbs, fat, fiber,
// vitA µg, vitD µg, vitE mg, vitK µg, vitC mg,
// b1 mg, b2 mg, b3 mg, b5 mg, b6 mg, b9 µg, b12 µg,
// calcium, iron, magnesium, phosphorus, potassium, sodium (mg), zinc mg, selenium µg, copper mg
function n(...v: number[]): Nutrients {
  const [kcal, protein, carbs, fat, fiber, vitA, vitD, vitE, vitK, vitC, b1, b2, b3, b5, b6, b9, b12, calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, selenium, copper] = v;
  return { kcal, protein, carbs, fat, fiber, vitA, vitD, vitE, vitK, vitC, b1, b2, b3, b5, b6, b9, b12, calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, selenium, copper } as Nutrients;
}

const g100: Serving = { vi: "100 g", en: "100 g", grams: 100 };
const ml100: Serving = { vi: "100 ml", en: "100 ml", grams: 100 };

// --- Fortify base proteins (sous-vide, per 100 g as weighed in the box) ----
export const FORTIFY_BASES = {
  chickenBreast: n(117, 24.7, 0, 2, 0, 9, 0.1, 0.56, 0, 0, 0.09, 0.15, 9.6, 1.5, 0.81, 4, 0.21, 5, 0.37, 28, 213, 334, 45, 0.68, 22.8, 0.04),
  chickenThigh: n(135, 20, 0, 6, 0, 7, 0.1, 0.18, 2, 0, 0.09, 0.19, 5.6, 1.0, 0.4, 6, 0.6, 7, 0.8, 23, 190, 240, 95, 1.6, 22, 0.06),
  beef: n(167, 23.3, 0, 8, 0, 0, 0.1, 0.2, 1.2, 0, 0.08, 0.18, 5.8, 0.6, 0.55, 7, 2.6, 12, 2.2, 22, 200, 330, 60, 4.5, 22, 0.08),
  shrimp: n(100, 21.3, 0, 1.3, 0, 2, 0, 1.3, 0, 0, 0.02, 0.02, 2.6, 0.4, 0.16, 19, 1.1, 64, 0.2, 22, 214, 113, 150, 1.1, 30, 0.17),
};

export const FOODS: Food[] = [
  // ---- Fortify extras (sides, sauces, oats) --------------------------------
  { id: "fk-oats", category: "fortify", vi: "Yến mạch ngâm qua đêm Fortify", en: "Fortify overnight oats", estimate: true,
    per100: n(140, 6, 20, 3.5, 2.5, 30, 0.5, 0.2, 1, 0.5, 0.15, 0.18, 0.3, 0.5, 0.05, 10, 0.3, 110, 1.0, 40, 140, 180, 40, 1.0, 6, 0.12),
    servings: [{ vi: "1 hũ (250 g)", en: "1 jar (250 g)", grams: 250 }, g100] },
  { id: "fk-brown-rice", coach: { ref: 27 }, category: "fortify", vi: "Gạo lứt (phần Fortify)", en: "Brown rice (Fortify side)",
    per100: n(112, 2.3, 23.5, 0.8, 1.8, 0, 0, 0.03, 0.2, 0, 0.1, 0.01, 1.5, 0.4, 0.15, 4, 0, 10, 0.5, 44, 83, 79, 1, 0.6, 9.8, 0.1),
    servings: [{ vi: "1 phần (190 g)", en: "1 side (190 g)", grams: 190 }, g100] },
  { id: "fk-sweet-potato", coach: { ref: 30 }, category: "fortify", vi: "Khoai lang (phần Fortify)", en: "Sweet potato (Fortify side)",
    per100: n(90, 2, 20.7, 0.15, 3.3, 961, 0, 0.7, 2.3, 19.6, 0.11, 0.11, 1.5, 0.88, 0.29, 6, 0, 38, 0.69, 27, 54, 475, 36, 0.32, 0.2, 0.16),
    servings: [{ vi: "1 phần (130 g)", en: "1 side (130 g)", grams: 130 }, g100] },
  { id: "fk-rice-noodle", category: "fortify", vi: "Bún lứt (phần Fortify)", en: "Brown rice noodles (Fortify side)",
    per100: n(110, 2, 24, 0.5, 1, 0, 0, 0, 0, 0, 0.03, 0.01, 0.5, 0.1, 0.05, 2, 0, 5, 0.3, 20, 40, 30, 5, 0.4, 5, 0.05),
    servings: [{ vi: "1 phần (165 g)", en: "1 side (165 g)", grams: 165 }, g100] },
  { id: "fk-sauce-sesame", category: "fortify", vi: "Xốt mè rang", en: "Roasted sesame sauce", estimate: true,
    per100: n(390, 5, 25, 30, 1, 0, 0, 1, 2, 0, 0.1, 0.05, 1, 0.1, 0.1, 10, 0, 100, 1.5, 50, 100, 80, 1000, 1, 5, 0.4),
    servings: [{ vi: "1 hũ xốt (20 g)", en: "1 sauce cup (20 g)", grams: 20 }] },
  { id: "fk-sauce-citrus", category: "fortify", vi: "Xốt cam chua ngọt", en: "Citrus sauce", estimate: true,
    per100: n(200, 0, 50, 0, 0.5, 5, 0, 0, 0, 20, 0.03, 0.01, 0.1, 0.05, 0.02, 10, 0, 10, 0.1, 5, 5, 80, 250, 0, 0, 0),
    servings: [{ vi: "1 hũ xốt (20 g)", en: "1 sauce cup (20 g)", grams: 20 }] },
  { id: "fk-sauce-spicy", category: "fortify", vi: "Xốt tương cay", en: "Spicy soy sauce", estimate: true,
    per100: n(110, 2.5, 20, 2.5, 1, 30, 0, 0.5, 2, 2, 0.02, 0.05, 1, 0.1, 0.05, 5, 0, 20, 1, 20, 60, 200, 2000, 0.3, 1, 0.05),
    servings: [{ vi: "1 hũ xốt (20 g)", en: "1 sauce cup (20 g)", grams: 20 }] },

  // ---- Vietnamese dishes (estimates) ---------------------------------------
  { id: "pho-bo", category: "dishes", vi: "Phở bò", en: "Beef phở", estimate: true,
    per100: n(90, 5.5, 12, 2.2, 0.4, 3, 0, 0.1, 5, 1.5, 0.03, 0.05, 1.2, 0.2, 0.08, 6, 0.4, 12, 0.8, 10, 50, 90, 380, 0.9, 5, 0.04),
    servings: [{ vi: "1 tô (500 g)", en: "1 bowl (500 g)", grams: 500 }, g100] },
  { id: "bun-bo-hue", category: "dishes", vi: "Bún bò Huế", en: "Bún bò Huế", estimate: true,
    per100: n(95, 5.5, 12, 2.8, 0.5, 5, 0, 0.2, 5, 1.5, 0.04, 0.05, 1.2, 0.2, 0.08, 6, 0.4, 15, 1.0, 10, 50, 90, 420, 0.9, 5, 0.04),
    servings: [{ vi: "1 tô (550 g)", en: "1 bowl (550 g)", grams: 550 }, g100] },
  { id: "banh-mi-thit", category: "dishes", vi: "Bánh mì thịt", en: "Bánh mì (pork)", estimate: true,
    per100: n(250, 10, 30, 9, 1.5, 20, 0, 0.5, 5, 2, 0.3, 0.15, 3, 0.4, 0.12, 40, 0.3, 50, 2, 20, 110, 150, 520, 1.1, 15, 0.1),
    servings: [{ vi: "1 ổ (200 g)", en: "1 sandwich (200 g)", grams: 200 }, g100] },
  { id: "com-tam", category: "dishes", vi: "Cơm tấm sườn", en: "Broken rice with pork chop", estimate: true,
    per100: n(165, 8, 20, 5.5, 0.5, 5, 0, 0.2, 3, 1, 0.15, 0.06, 2, 0.4, 0.12, 5, 0.2, 10, 0.6, 15, 90, 120, 300, 1.0, 10, 0.06),
    servings: [{ vi: "1 dĩa (400 g)", en: "1 plate (400 g)", grams: 400 }, g100] },
  { id: "goi-cuon", category: "dishes", vi: "Gỏi cuốn", en: "Fresh spring roll", estimate: true,
    per100: n(105, 6, 17, 1.5, 1, 40, 0, 0.3, 30, 4, 0.05, 0.04, 1, 0.2, 0.08, 15, 0.2, 25, 0.5, 12, 60, 120, 180, 0.5, 10, 0.06),
    servings: [{ vi: "1 cuốn (100 g)", en: "1 roll (100 g)", grams: 100 }] },
  { id: "mi-goi", category: "dishes", vi: "Mì gói (vắt khô + gói gia vị)", en: "Instant noodles (dry block + seasoning)", estimate: true,
    per100: n(440, 9, 63, 17, 2.4, 0, 0, 2, 5, 0, 0.1, 0.05, 1, 0.2, 0.05, 10, 0, 20, 1.2, 25, 100, 150, 1800, 0.6, 20, 0.1),
    servings: [{ vi: "1 gói (75 g)", en: "1 pack (75 g)", grams: 75 }] },

  // ---- Grains & starch -----------------------------------------------------
  { id: "com-trang", coach: { ref: 27 }, category: "grains", vi: "Cơm trắng", en: "White rice (cooked)",
    per100: n(130, 2.7, 28.2, 0.3, 0.4, 0, 0, 0.04, 0, 0, 0.02, 0.01, 0.4, 0.39, 0.09, 3, 0, 10, 0.2, 12, 43, 35, 1, 0.49, 7.5, 0.07),
    servings: [{ vi: "1 chén (150 g)", en: "1 bowl (150 g)", grams: 150 }, g100] },
  { id: "xoi", category: "grains", vi: "Xôi trắng", en: "Sticky rice (cooked)",
    per100: n(97, 2, 21, 0.2, 1, 0, 0, 0, 0, 0, 0.02, 0.01, 0.3, 0.2, 0.03, 1, 0, 2, 0.1, 5, 8, 10, 5, 0.4, 5.6, 0.04),
    servings: [{ vi: "1 gói (200 g)", en: "1 portion (200 g)", grams: 200 }, g100] },
  { id: "bun-tuoi", category: "grains", vi: "Bún tươi", en: "Rice vermicelli (cooked)",
    per100: n(108, 1.8, 24, 0.2, 1, 0, 0, 0, 0, 0, 0.03, 0.01, 0.07, 0.07, 0.01, 1, 0, 4, 0.14, 3, 20, 4, 19, 0.25, 4.5, 0.03),
    servings: [{ vi: "1 phần (200 g)", en: "1 portion (200 g)", grams: 200 }, g100] },
  { id: "banh-mi-trang", category: "grains", vi: "Bánh mì không", en: "Plain baguette",
    per100: n(270, 9, 52, 3.3, 2.3, 0, 0, 0.2, 0.5, 0, 0.5, 0.3, 4.7, 0.4, 0.08, 30, 0, 50, 1.2, 25, 100, 115, 600, 0.8, 25, 0.15),
    servings: [{ vi: "1 ổ (80 g)", en: "1 roll (80 g)", grams: 80 }, g100] },
  { id: "yen-mach", category: "grains", vi: "Yến mạch (khô)", en: "Rolled oats (dry)",
    per100: n(389, 16.9, 66.3, 6.9, 10.6, 0, 0, 0.4, 2, 0, 0.76, 0.14, 0.96, 1.35, 0.12, 56, 0, 54, 4.7, 177, 523, 429, 2, 4.0, 28.9, 0.63),
    servings: [{ vi: "1 phần (40 g)", en: "1 serving (40 g)", grams: 40 }, g100] },
  { id: "khoai-tay", coach: { ref: 30 }, category: "grains", vi: "Khoai tây luộc", en: "Boiled potato",
    per100: n(87, 1.9, 20, 0.1, 1.8, 0, 0, 0.01, 2.1, 13, 0.1, 0.02, 1.44, 0.52, 0.3, 10, 0, 5, 0.31, 22, 44, 379, 4, 0.3, 0.3, 0.19),
    servings: [{ vi: "1 củ vừa (150 g)", en: "1 medium (150 g)", grams: 150 }, g100] },
  { id: "bap", category: "grains", vi: "Bắp luộc", en: "Boiled corn",
    per100: n(96, 3.4, 21, 1.5, 2.4, 13, 0, 0.07, 0.4, 5.5, 0.09, 0.06, 1.68, 0.79, 0.14, 23, 0, 3, 0.45, 26, 77, 218, 1, 0.62, 0.2, 0.05),
    servings: [{ vi: "1 trái (100 g hạt)", en: "1 cob (100 g kernels)", grams: 100 }] },

  // ---- Meat, fish, eggs, tofu ----------------------------------------------
  { id: "trung-ga", category: "protein", vi: "Trứng gà luộc", en: "Boiled egg",
    per100: n(155, 12.6, 1.1, 10.6, 0, 149, 2.2, 1.03, 0.3, 0, 0.07, 0.51, 0.06, 1.4, 0.12, 44, 1.11, 50, 1.19, 10, 172, 126, 124, 1.05, 30.8, 0.01),
    servings: [{ vi: "1 quả (50 g)", en: "1 egg (50 g)", grams: 50 }, g100] },
  { id: "uc-ga-chin", category: "protein", vi: "Ức gà nướng/luộc", en: "Chicken breast (cooked)",
    per100: n(165, 31, 0, 3.6, 0, 6, 0.1, 0.27, 0.3, 0, 0.07, 0.11, 13.7, 0.97, 0.6, 4, 0.34, 15, 1.04, 29, 228, 256, 74, 1.0, 27.6, 0.05),
    servings: [g100] },
  { id: "bo-nac", coach: { ref: 13 }, category: "protein", vi: "Thịt bò nạc (chín)", en: "Lean beef (cooked)",
    per100: n(200, 30, 0, 8, 0, 0, 0.1, 0.3, 1.5, 0, 0.08, 0.17, 7, 0.6, 0.6, 8, 2.6, 15, 2.7, 25, 230, 350, 60, 5.5, 30, 0.1),
    servings: [g100] },
  { id: "heo-nac", category: "protein", vi: "Thịt heo nạc (chín)", en: "Lean pork (cooked)",
    per100: n(170, 29, 0, 5, 0, 2, 0.6, 0.2, 0, 0, 0.9, 0.3, 8, 0.8, 0.7, 2, 0.6, 15, 0.9, 28, 250, 400, 55, 2.3, 42, 0.08),
    servings: [g100] },
  { id: "ba-chi", category: "protein", vi: "Thịt ba chỉ", en: "Pork belly",
    per100: n(518, 9.3, 0, 53, 0, 3, 0.5, 0.4, 0, 0, 0.4, 0.24, 4.6, 0.4, 0.2, 1, 0.8, 5, 0.5, 9, 150, 185, 32, 1.0, 8, 0.05),
    servings: [g100] },
  { id: "ca-hoi", category: "protein", vi: "Cá hồi (chín)", en: "Salmon (cooked)",
    per100: n(206, 22, 0, 12.4, 0, 50, 13.1, 1.1, 0.1, 3.7, 0.34, 0.14, 8.5, 1.5, 0.65, 34, 2.8, 15, 0.34, 30, 252, 384, 61, 0.43, 41.4, 0.05),
    servings: [g100] },
  { id: "ca-basa", category: "protein", vi: "Cá basa (chín)", en: "Basa / pangasius (cooked)", estimate: true,
    per100: n(120, 18, 0, 5, 0, 10, 1, 0.5, 0, 0, 0.04, 0.05, 2.5, 0.3, 0.15, 10, 1.2, 10, 0.3, 25, 180, 300, 60, 0.4, 15, 0.03),
    servings: [g100] },
  { id: "ca-ngu-hop", category: "protein", vi: "Cá ngừ đóng hộp (ngâm nước)", en: "Canned tuna (in water)",
    per100: n(116, 25.5, 0, 0.8, 0, 5, 1.7, 0.3, 0, 0, 0.03, 0.07, 13, 0.2, 0.35, 4, 2.5, 11, 1.0, 27, 163, 237, 247, 0.6, 70.6, 0.05),
    servings: [{ vi: "1 hộp (đã ráo, 120 g)", en: "1 can drained (120 g)", grams: 120 }, g100] },
  { id: "dau-hu", category: "protein", vi: "Đậu hũ", en: "Tofu",
    per100: n(76, 8.1, 1.9, 4.8, 0.3, 4, 0, 0.01, 2, 0, 0.08, 0.05, 0.2, 0.07, 0.05, 15, 0, 200, 2.0, 30, 97, 121, 7, 0.8, 8.9, 0.19),
    servings: [{ vi: "1 bìa (150 g)", en: "1 block (150 g)", grams: 150 }, g100] },

  // ---- Vegetables ----------------------------------------------------------
  { id: "rau-muong", coach: { ref: 42, note: "nitrates" }, category: "veg", vi: "Rau muống xào", en: "Stir-fried water spinach", estimate: true,
    per100: n(60, 2.6, 3.5, 4.5, 2, 300, 0, 1.0, 250, 30, 0.05, 0.1, 0.9, 0.14, 0.1, 57, 0, 77, 1.7, 71, 39, 312, 300, 0.18, 0.9, 0.02),
    servings: [{ vi: "1 dĩa (150 g)", en: "1 plate (150 g)", grams: 150 }, g100] },
  { id: "cai-ngot", coach: { ref: 42, note: "nitrates" }, category: "veg", vi: "Cải ngọt/cải thìa luộc", en: "Boiled bok choy",
    per100: n(12, 1.6, 1.8, 0.2, 1, 210, 0, 0.1, 34, 26, 0.03, 0.06, 0.43, 0.08, 0.17, 41, 0, 93, 1.04, 11, 29, 371, 34, 0.17, 0.4, 0.02),
    servings: [{ vi: "1 dĩa (150 g)", en: "1 plate (150 g)", grams: 150 }, g100] },
  { id: "rau-bina", coach: { ref: 42, note: "nitrates" }, category: "veg", vi: "Cải bó xôi luộc", en: "Boiled spinach",
    per100: n(23, 3, 3.75, 0.26, 2.4, 524, 0, 2.1, 494, 9.8, 0.1, 0.24, 0.49, 0.15, 0.24, 146, 0, 136, 3.57, 87, 56, 466, 70, 0.76, 1.5, 0.17),
    servings: [{ vi: "1 chén (100 g)", en: "1 cup (100 g)", grams: 100 }] },
  { id: "bong-cai", coach: { ref: 42, note: "nitrates" }, category: "veg", vi: "Bông cải xanh luộc", en: "Boiled broccoli",
    per100: n(35, 2.4, 7.2, 0.4, 3.3, 77, 0, 1.45, 141, 64.9, 0.06, 0.12, 0.55, 0.6, 0.2, 108, 0, 40, 0.67, 21, 67, 293, 41, 0.45, 1.6, 0.06),
    servings: [{ vi: "1 phần (80 g)", en: "1 side (80 g)", grams: 80 }, g100] },
  { id: "ca-chua", category: "veg", vi: "Cà chua", en: "Tomato",
    per100: n(18, 0.9, 3.9, 0.2, 1.2, 42, 0, 0.54, 7.9, 13.7, 0.04, 0.02, 0.6, 0.09, 0.08, 15, 0, 10, 0.27, 11, 24, 237, 5, 0.17, 0, 0.06),
    servings: [{ vi: "1 quả (120 g)", en: "1 tomato (120 g)", grams: 120 }, g100] },
  { id: "dua-leo", category: "veg", vi: "Dưa leo", en: "Cucumber",
    per100: n(15, 0.65, 3.6, 0.1, 0.5, 5, 0, 0.03, 16.4, 2.8, 0.03, 0.03, 0.1, 0.26, 0.04, 7, 0, 16, 0.28, 13, 24, 147, 2, 0.2, 0.3, 0.04),
    servings: [{ vi: "1 trái (150 g)", en: "1 cucumber (150 g)", grams: 150 }, g100] },
  { id: "ca-rot", category: "veg", vi: "Cà rốt", en: "Carrot",
    per100: n(41, 0.9, 9.6, 0.24, 2.8, 835, 0, 0.66, 13.2, 5.9, 0.07, 0.06, 0.98, 0.27, 0.14, 19, 0, 33, 0.3, 12, 35, 320, 69, 0.24, 0.1, 0.05),
    servings: [{ vi: "1 củ (80 g)", en: "1 carrot (80 g)", grams: 80 }, g100] },
  { id: "bi-do", category: "veg", vi: "Bí đỏ nấu", en: "Cooked pumpkin",
    per100: n(20, 0.7, 4.9, 0.1, 1.1, 288, 0, 0.8, 0.8, 4.7, 0.03, 0.08, 0.4, 0.2, 0.04, 9, 0, 15, 0.57, 9, 30, 230, 1, 0.23, 0.2, 0.09),
    servings: [{ vi: "1 chén (150 g)", en: "1 bowl (150 g)", grams: 150 }, g100] },
  { id: "gia", category: "veg", vi: "Giá đỗ", en: "Bean sprouts",
    per100: n(30, 3, 5.9, 0.2, 1.8, 1, 0, 0.1, 33, 13.2, 0.08, 0.12, 0.75, 0.38, 0.09, 61, 0, 13, 0.91, 21, 54, 149, 6, 0.41, 0.6, 0.16),
    servings: [{ vi: "1 nắm (50 g)", en: "1 handful (50 g)", grams: 50 }, g100] },
  { id: "nam-huong", coach: { ref: 41 }, category: "veg", vi: "Nấm hương nấu", en: "Cooked shiitake",
    per100: n(56, 1.6, 14.4, 0.2, 2.1, 0, 0.4, 0, 0, 0.3, 0.04, 0.17, 1.5, 3.6, 0.16, 21, 0, 3, 0.44, 14, 29, 117, 4, 1.33, 24.8, 0.9),
    servings: [{ vi: "1 phần (60 g)", en: "1 side (60 g)", grams: 60 }, g100] },

  // ---- Fruit ---------------------------------------------------------------
  { id: "chuoi", coach: { ref: 31 }, category: "fruit", vi: "Chuối", en: "Banana",
    per100: n(89, 1.1, 22.8, 0.3, 2.6, 3, 0, 0.1, 0.5, 8.7, 0.03, 0.07, 0.67, 0.33, 0.37, 20, 0, 5, 0.26, 27, 22, 358, 1, 0.15, 1, 0.08),
    servings: [{ vi: "1 quả (120 g)", en: "1 banana (120 g)", grams: 120 }, g100] },
  { id: "cam", category: "fruit", vi: "Cam", en: "Orange",
    per100: n(47, 0.94, 11.8, 0.12, 2.4, 11, 0, 0.18, 0, 53.2, 0.09, 0.04, 0.28, 0.25, 0.06, 30, 0, 40, 0.1, 10, 14, 181, 0, 0.07, 0.5, 0.05),
    servings: [{ vi: "1 quả (150 g)", en: "1 orange (150 g)", grams: 150 }, g100] },
  { id: "oi", category: "fruit", vi: "Ổi", en: "Guava",
    per100: n(68, 2.55, 14.3, 0.95, 5.4, 31, 0, 0.73, 2.6, 228, 0.07, 0.04, 1.08, 0.45, 0.11, 49, 0, 18, 0.26, 22, 40, 417, 2, 0.23, 0.6, 0.23),
    servings: [{ vi: "1 quả (150 g)", en: "1 guava (150 g)", grams: 150 }, g100] },
  { id: "xoai", category: "fruit", vi: "Xoài chín", en: "Ripe mango",
    per100: n(60, 0.82, 15, 0.38, 1.6, 54, 0, 0.9, 4.2, 36.4, 0.03, 0.04, 0.67, 0.2, 0.12, 43, 0, 11, 0.16, 10, 14, 168, 1, 0.09, 0.6, 0.11),
    servings: [{ vi: "1 quả (200 g phần ăn)", en: "1 mango (200 g flesh)", grams: 200 }, g100] },
  { id: "du-du", coach: { ref: 19 }, category: "fruit", vi: "Đu đủ", en: "Papaya",
    per100: n(43, 0.47, 10.8, 0.26, 1.7, 47, 0, 0.3, 2.6, 60.9, 0.02, 0.03, 0.36, 0.19, 0.04, 37, 0, 20, 0.25, 21, 10, 182, 8, 0.08, 0.6, 0.05),
    servings: [{ vi: "1 chén (150 g)", en: "1 cup (150 g)", grams: 150 }, g100] },
  { id: "thanh-long", coach: { ref: 34 }, category: "fruit", vi: "Thanh long đỏ", en: "Red dragon fruit", estimate: true,
    per100: n(60, 1.2, 13, 0.4, 3, 0, 0, 0.1, 4, 3, 0.04, 0.05, 0.16, 0.1, 0.04, 7, 0, 18, 0.74, 40, 22, 120, 0, 0.3, 0.5, 0.03),
    servings: [{ vi: "1/2 quả (200 g)", en: "1/2 fruit (200 g)", grams: 200 }, g100] },
  { id: "bo", coach: { ref: 4 }, category: "fruit", vi: "Bơ", en: "Avocado",
    per100: n(160, 2, 8.5, 14.7, 6.7, 7, 0, 2.07, 21, 10, 0.07, 0.13, 1.74, 1.39, 0.26, 81, 0, 12, 0.55, 29, 52, 485, 7, 0.64, 0.4, 0.19),
    servings: [{ vi: "1/2 quả (100 g)", en: "1/2 avocado (100 g)", grams: 100 }] },
  { id: "tao", category: "fruit", vi: "Táo", en: "Apple",
    per100: n(52, 0.26, 13.8, 0.17, 2.4, 3, 0, 0.18, 2.2, 4.6, 0.02, 0.03, 0.09, 0.06, 0.04, 3, 0, 6, 0.12, 5, 11, 107, 1, 0.04, 0, 0.03),
    servings: [{ vi: "1 quả (180 g)", en: "1 apple (180 g)", grams: 180 }, g100] },

  // ---- Dairy & drinks ------------------------------------------------------
  { id: "sua-tuoi", category: "dairy", vi: "Sữa tươi không đường", en: "Whole milk (unsweetened)",
    per100: n(61, 3.2, 4.8, 3.3, 0, 46, 1.0, 0.07, 0.3, 0, 0.04, 0.17, 0.09, 0.37, 0.04, 5, 0.45, 113, 0.03, 10, 84, 132, 43, 0.37, 3.7, 0.01),
    servings: [{ vi: "1 hộp (180 ml)", en: "1 carton (180 ml)", grams: 180 }, ml100] },
  { id: "sua-chua", category: "dairy", vi: "Sữa chua không đường", en: "Plain yogurt",
    per100: n(61, 3.5, 4.7, 3.3, 0, 27, 0.1, 0.06, 0.2, 0.5, 0.03, 0.14, 0.08, 0.39, 0.03, 7, 0.37, 121, 0.05, 12, 95, 155, 46, 0.59, 2.2, 0.01),
    servings: [{ vi: "1 hũ (100 g)", en: "1 cup (100 g)", grams: 100 }] },
  { id: "sua-dau-nanh", category: "dairy", vi: "Sữa đậu nành (có đường)", en: "Soy milk (sweetened)", estimate: true,
    per100: n(60, 3, 8, 1.8, 0.5, 0, 0, 0.1, 3, 0, 0.06, 0.07, 0.5, 0.1, 0.05, 15, 0, 25, 0.6, 25, 50, 120, 30, 0.3, 3, 0.15),
    servings: [{ vi: "1 ly (250 ml)", en: "1 glass (250 ml)", grams: 250 }, ml100] },
  { id: "ca-phe-sua", category: "dairy", vi: "Cà phê sữa đá", en: "Iced coffee with condensed milk", estimate: true,
    per100: n(70, 1.5, 12, 1.8, 0, 15, 0, 0, 0, 0, 0.01, 0.08, 0.5, 0.1, 0.01, 2, 0.1, 50, 0.05, 8, 45, 90, 25, 0.2, 1, 0.01),
    servings: [{ vi: "1 ly (200 ml)", en: "1 glass (200 ml)", grams: 200 }, ml100] },
  { id: "tra-sua", category: "dairy", vi: "Trà sữa trân châu", en: "Bubble milk tea", estimate: true,
    per100: n(90, 0.8, 17, 2.2, 0, 5, 0, 0, 0, 0, 0, 0.03, 0, 0.05, 0, 1, 0.05, 30, 0.1, 3, 25, 40, 20, 0.1, 0.5, 0),
    servings: [{ vi: "1 ly M (500 ml)", en: "1 medium cup (500 ml)", grams: 500 }, ml100] },
  { id: "whey", category: "dairy", vi: "Whey protein (bột)", en: "Whey protein powder", estimate: true,
    per100: n(400, 80, 8, 6, 0, 0, 0, 0, 0, 0, 0.2, 0.5, 1, 1, 0.2, 10, 1, 400, 1, 60, 300, 500, 200, 1, 10, 0.05),
    servings: [{ vi: "1 muỗng (30 g)", en: "1 scoop (30 g)", grams: 30 }] },

  // ---- Nuts, oils, condiments ----------------------------------------------
  { id: "dau-phong", category: "extras", vi: "Đậu phộng rang", en: "Roasted peanuts",
    per100: n(585, 23.7, 21.5, 49.7, 8.4, 0, 0, 6.9, 0, 0, 0.15, 0.1, 13.5, 1.4, 0.47, 145, 0, 54, 2.3, 176, 358, 658, 6, 3.3, 7.5, 0.67),
    servings: [{ vi: "1 nắm (30 g)", en: "1 handful (30 g)", grams: 30 }, g100] },
  { id: "hat-dieu", category: "extras", vi: "Hạt điều rang", en: "Roasted cashews",
    per100: n(574, 15.3, 32.7, 46.4, 3, 0, 0, 0.9, 34.7, 0, 0.2, 0.2, 1.4, 1.2, 0.26, 69, 0, 45, 6, 260, 490, 565, 16, 5.6, 11.7, 2.2),
    servings: [{ vi: "1 nắm (30 g)", en: "1 handful (30 g)", grams: 30 }, g100] },
  { id: "dau-an", category: "extras", vi: "Dầu ăn (đậu nành)", en: "Cooking oil (soybean)",
    per100: n(884, 0, 0, 100, 0, 0, 0, 8.2, 183, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    servings: [{ vi: "1 muỗng canh (13 g)", en: "1 tbsp (13 g)", grams: 13 }] },
  { id: "nuoc-mam", category: "extras", vi: "Nước mắm", en: "Fish sauce",
    per100: n(35, 5, 3.6, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.06, 2.3, 0.03, 0.4, 51, 0.5, 43, 0.8, 175, 7, 288, 7850, 0.2, 37, 0.02),
    servings: [{ vi: "1 muỗng canh (18 g)", en: "1 tbsp (18 g)", grams: 18 }] },

  // ---- Coach's list: foods not covered above (docs/coach-food-list.md) -----
  // Nutrient values are USDA FoodData Central approximations per 100 g/ml.
  { id: "coach-dates", category: "fruit", vi: "Chà là", en: "Dates", coach: { ref: 1, note: "30 g đầu buổi tập (carb chậm)" },
    per100: n(277, 1.8, 75, 0.15, 6.7, 7, 0, 0.05, 2.7, 0, 0.05, 0.06, 1.61, 0.81, 0.25, 15, 0, 64, 0.9, 54, 62, 696, 1, 0.44, 3, 0.36),
    servings: [{ vi: "Trước tập (30 g)", en: "Pre-workout (30 g)", grams: 30 }, g100] },
  { id: "coach-salt", category: "extras", vi: "Muối", en: "Salt", coach: { ref: 2, note: "4–6 g/ngày chia theo bữa; 1–1,5 g mỗi 20 phút trong tập" },
    per100: n(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0.33, 1, 0, 8, 38758, 0.1, 0.1, 0.03),
    servings: [{ vi: "1 g", en: "1 g", grams: 1 }, { vi: "2 g", en: "2 g", grams: 2 }] },
  { id: "coach-redbull", category: "dairy", vi: "Redbull", en: "Red Bull", estimate: true,
    coach: { ref: 3, note: "30–45 g carb nhanh / giờ trong tập, nhấp theo từng set nặng", benefit: "Taurine, Caffeine, Carb, B" },
    per100: n(45, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 2, 2, 0, 2, 0, 0, 0, 0, 0, 40, 0, 0, 0),
    servings: [{ vi: "1 lon (250 ml)", en: "1 can (250 ml)", grams: 250 }, ml100] },
  { id: "coach-olive-oil", category: "extras", vi: "Dầu olive", en: "Olive oil", coach: { ref: 5, brand: "Pendleton" },
    per100: n(884, 0, 0, 100, 0, 0, 0, 14.4, 60.2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.56, 0, 0, 1, 2, 0, 0, 0),
    servings: [{ vi: "1 muỗng canh (14 g)", en: "1 tbsp (14 g)", grams: 14 }] },
  { id: "coach-pumpkin-seeds", category: "extras", vi: "Hạt bí", en: "Pumpkin seeds", coach: { ref: 6 },
    per100: n(559, 30.2, 10.7, 49, 6, 1, 0, 2.18, 7.3, 1.9, 0.27, 0.15, 4.99, 0.75, 0.14, 58, 0, 46, 8.82, 592, 1233, 809, 7, 7.81, 9.4, 1.34),
    servings: [{ vi: "1 nắm (30 g)", en: "1 handful (30 g)", grams: 30 }, g100] },
  { id: "coach-kefir", category: "dairy", vi: "Yogurt kefir", en: "Kefir yogurt", coach: { ref: 7, benefit: "Tiêu hoá" },
    per100: n(61, 3.3, 4.5, 3.5, 0, 30, 0.1, 0.05, 0.2, 1, 0.04, 0.17, 0.1, 0.3, 0.04, 5, 0.3, 120, 0.04, 12, 100, 160, 40, 0.4, 2, 0.01),
    servings: [{ vi: "1 hũ (200 ml)", en: "1 jar (200 ml)", grams: 200 }, ml100] },
  { id: "coach-kimchi", category: "veg", vi: "Kim chi", en: "Kimchi", coach: { ref: 8, benefit: "Tiêu hoá" },
    per100: n(15, 1.1, 2.4, 0.5, 1.6, 5, 0, 0.1, 43.6, 10, 0.02, 0.02, 1.1, 0.05, 0.1, 52, 0, 33, 2.5, 14, 24, 151, 498, 0.2, 0.5, 0.03),
    servings: [{ vi: "1 chén nhỏ (50 g)", en: "1 small bowl (50 g)", grams: 50 }, g100] },
  { id: "coach-dua-chua", category: "veg", vi: "Dưa chua", en: "Pickled mustard greens", estimate: true, coach: { ref: 9, benefit: "Tiêu hoá" },
    per100: n(20, 1.2, 3, 0.2, 2, 50, 0, 0.5, 100, 10, 0.02, 0.03, 0.4, 0.1, 0.1, 30, 0, 60, 1, 15, 30, 200, 800, 0.2, 0.5, 0.05),
    servings: [{ vi: "1 chén nhỏ (50 g)", en: "1 small bowl (50 g)", grams: 50 }, g100] },
  { id: "coach-sauerkraut", category: "veg", vi: "Sauerkraut (bắp cải muối)", en: "Sauerkraut", coach: { ref: "extra", benefit: "Tiêu hoá" },
    per100: n(19, 0.9, 4.3, 0.1, 2.9, 1, 0, 0.14, 13, 14.7, 0.02, 0.02, 0.14, 0.09, 0.13, 24, 0, 30, 1.47, 13, 20, 170, 661, 0.19, 0.6, 0.1),
    servings: [{ vi: "1 chén nhỏ (50 g)", en: "1 small bowl (50 g)", grams: 50 }, g100] },
  { id: "coach-berries", category: "fruit", vi: "Berries đông lạnh", en: "Frozen berries", estimate: true, coach: { ref: 10, note: "đông lạnh" },
    per100: n(45, 0.6, 11, 0.4, 2.5, 3, 0, 0.4, 12, 25, 0.03, 0.04, 0.5, 0.12, 0.05, 15, 0, 13, 0.4, 10, 15, 120, 1, 0.1, 0.3, 0.05),
    servings: [{ vi: "1 chén (150 g)", en: "1 cup (150 g)", grams: 150 }, g100] },
  { id: "coach-cooked-tomato", category: "veg", vi: "Cà chua nấu chín", en: "Cooked tomato", coach: { ref: 11, note: "nấu chín" },
    per100: n(18, 0.95, 4, 0.1, 0.7, 24, 0, 0.56, 2.8, 22.8, 0.04, 0.02, 0.53, 0.3, 0.08, 13, 0, 11, 0.68, 9, 28, 218, 11, 0.14, 0.5, 0.08),
    servings: [{ vi: "1 chén (150 g)", en: "1 cup (150 g)", grams: 150 }, g100] },
  { id: "coach-matcha", category: "dairy", vi: "Matcha ủ nóng", en: "Hot-brewed matcha", estimate: true,
    coach: { ref: 12, note: "ủ nóng", benefit: "Hormone / bền" },
    per100: n(324, 30.6, 39, 5.3, 38.5, 2400, 0, 28, 2900, 60, 0.6, 1.35, 4, 1, 0.96, 1200, 0, 420, 17, 230, 350, 2700, 6, 6.3, 0, 0.6),
    servings: [{ vi: "1 ly (2 g bột)", en: "1 cup (2 g powder)", grams: 2 }] },
  { id: "coach-small-fish", category: "protein", vi: "Cá rục xương (cá nhỏ ăn cả xương)", en: "Small whole fish (bones in)", estimate: true, coach: { ref: 14 },
    per100: n(208, 24.6, 0, 11.5, 0, 32, 4.8, 2, 2.6, 0, 0.08, 0.23, 5.2, 0.64, 0.17, 10, 8.9, 382, 2.92, 39, 490, 397, 307, 1.31, 52.7, 0.19),
    servings: [g100] },
  { id: "coach-oysters", category: "protein", vi: "Hàu", en: "Oysters", coach: { ref: 15 },
    per100: n(81, 9.5, 5, 2.3, 0, 81, 2, 0.85, 2, 8, 0.07, 0.23, 2, 0.5, 0.05, 10, 16, 8, 5.1, 22, 162, 168, 106, 16.6, 77, 1.58),
    servings: [{ vi: "6 con (100 g)", en: "6 oysters (100 g)", grams: 100 }] },
  { id: "coach-liver", category: "protein", vi: "Gan bò (chín)", en: "Beef liver (cooked)", coach: { ref: 16 },
    per100: n(175, 26.5, 5.1, 4.7, 0, 9000, 1.2, 0.5, 3, 1.9, 0.18, 3.4, 17.5, 7, 1.03, 253, 70.6, 6, 6.5, 21, 497, 352, 79, 5.3, 36, 14.6),
    servings: [{ vi: "1 phần (50 g)", en: "1 serving (50 g)", grams: 50 }, g100] },
  { id: "coach-clams", category: "protein", vi: "Nghêu, ốc, sò, hến", en: "Clams, snails, cockles, mussels", estimate: true, coach: { ref: 17 },
    per100: n(148, 25.5, 5.1, 2, 0, 171, 0, 1.2, 0.3, 22, 0.15, 0.43, 3.4, 0.68, 0.11, 29, 98.9, 92, 2.8, 18, 338, 628, 300, 2.73, 64, 0.69),
    servings: [{ vi: "1 dĩa (100 g thịt)", en: "1 plate (100 g meat)", grams: 100 }] },
  { id: "coach-pineapple", category: "fruit", vi: "Trái thơm (dứa)", en: "Pineapple", coach: { ref: 18 },
    per100: n(50, 0.54, 13.1, 0.12, 1.4, 3, 0, 0.02, 0.7, 47.8, 0.08, 0.03, 0.5, 0.21, 0.11, 18, 0, 13, 0.29, 12, 8, 109, 1, 0.12, 0.1, 0.11),
    servings: [{ vi: "1 chén (165 g)", en: "1 cup (165 g)", grams: 165 }, g100] },
  { id: "coach-kiwi", category: "fruit", vi: "Kiwi", en: "Kiwi", coach: { ref: 20 },
    per100: n(61, 1.14, 14.7, 0.52, 3, 4, 0, 1.46, 40.3, 92.7, 0.03, 0.03, 0.34, 0.18, 0.06, 25, 0, 34, 0.31, 17, 34, 312, 3, 0.14, 0.2, 0.13),
    servings: [{ vi: "1 quả (75 g)", en: "1 kiwi (75 g)", grams: 75 }, g100] },
  { id: "coach-ginger", category: "extras", vi: "Gừng", en: "Ginger", coach: { ref: 21, brand: "Dalahouse", benefit: "Tiêu hoá" },
    per100: n(80, 1.82, 17.8, 0.75, 2, 0, 0, 0.26, 0.1, 5, 0.03, 0.03, 0.75, 0.2, 0.16, 11, 0, 16, 0.6, 43, 34, 415, 13, 0.34, 0.7, 0.23),
    servings: [{ vi: "1 muỗng cà phê (5 g)", en: "1 tsp (5 g)", grams: 5 }, g100] },
  // Coach uses 3 g before training, so this is the dried powder (values ≈ fresh beet concentrated ~7×).
  { id: "coach-beet", category: "extras", vi: "Bột củ dền", en: "Beetroot powder", estimate: true,
    coach: { ref: 22, brand: "Dalahouse", note: "3 g trước tập", benefit: "Pump / sinh lý; tăng lưu chuyển dinh dưỡng, tiết kiệm thời gian khởi động" },
    per100: n(320, 12, 73, 1.3, 14.6, 15, 0, 0.3, 1.5, 10, 0.22, 0.29, 2.4, 1.1, 0.5, 580, 0, 117, 5.8, 168, 277, 2230, 560, 2.6, 5, 0.5),
    servings: [{ vi: "Trước tập (3 g)", en: "Pre-workout (3 g)", grams: 3 }, { vi: "1 muỗng (5 g)", en: "1 scoop (5 g)", grams: 5 }] },
  { id: "coach-garlic", category: "extras", vi: "Tỏi", en: "Garlic", coach: { ref: 23 },
    per100: n(149, 6.36, 33, 0.5, 2.1, 0, 0, 0.08, 1.7, 31.2, 0.2, 0.11, 0.7, 0.6, 1.24, 3, 0, 181, 1.7, 25, 153, 401, 17, 1.16, 14.2, 0.3),
    servings: [{ vi: "3 tép (10 g)", en: "3 cloves (10 g)", grams: 10 }] },
  { id: "coach-turmeric", category: "extras", vi: "Nghệ (bột)", en: "Turmeric (ground)", coach: { ref: 24 },
    per100: n(312, 9.7, 67, 3.25, 22.7, 0, 0, 4.4, 13.4, 0.7, 0.06, 0.15, 1.35, 0.54, 0.11, 20, 0, 168, 55, 208, 299, 2080, 27, 4.5, 6.2, 1.3),
    servings: [{ vi: "1 muỗng cà phê (3 g)", en: "1 tsp (3 g)", grams: 3 }] },
  { id: "coach-cinnamon", category: "extras", vi: "Quế (bột)", en: "Cinnamon (ground)", coach: { ref: 25 },
    per100: n(247, 4, 81, 1.2, 53, 15, 0, 2.3, 31.2, 3.8, 0.02, 0.04, 1.33, 0.36, 0.16, 6, 0, 1002, 8.3, 60, 64, 431, 10, 1.83, 3.1, 0.34),
    servings: [{ vi: "1 muỗng cà phê (3 g)", en: "1 tsp (3 g)", grams: 3 }] },
  { id: "coach-pepper", category: "extras", vi: "Tiêu", en: "Black pepper", coach: { ref: 26 },
    per100: n(251, 10.4, 64, 3.3, 25.3, 27, 0, 1.04, 163.7, 0, 0.11, 0.18, 1.14, 1.4, 0.29, 17, 0, 443, 9.7, 171, 158, 1329, 20, 1.19, 4.9, 1.33),
    servings: [{ vi: "1 nhúm (1 g)", en: "1 pinch (1 g)", grams: 1 }] },
  { id: "coach-molasses", category: "extras", vi: "Mật mía", en: "Molasses", coach: { ref: 28, brand: "Golden Barrel", note: "carb nhanh trong tập", benefit: "Carb, Potassium" },
    per100: n(290, 0, 74.7, 0.1, 0, 0, 0, 0, 0, 0, 0.04, 0, 0.93, 0.8, 0.67, 0, 0, 205, 4.72, 242, 31, 1464, 37, 0.29, 17.8, 0.49),
    servings: [{ vi: "1 muỗng canh (20 g)", en: "1 tbsp (20 g)", grams: 20 }] },
  { id: "coach-palm-sugar", category: "extras", vi: "Mật thốt nốt", en: "Palm sugar syrup", estimate: true, coach: { ref: "extra", benefit: "Carb, Potassium" },
    per100: n(375, 1, 93, 0.5, 0, 0, 0, 0, 0, 0, 0.01, 0.02, 0.4, 0.1, 0.02, 1, 0, 30, 1.5, 30, 40, 700, 40, 0.5, 1, 0.2),
    servings: [{ vi: "1 muỗng canh (15 g)", en: "1 tbsp (15 g)", grams: 15 }] },
  { id: "coach-honey", category: "extras", vi: "Mật ong", en: "Honey", coach: { ref: 29 },
    per100: n(304, 0.3, 82.4, 0, 0.2, 0, 0, 0, 0, 0.5, 0, 0.04, 0.12, 0.07, 0.02, 2, 0, 6, 0.42, 2, 4, 52, 4, 0.22, 0.8, 0.04),
    servings: [{ vi: "1 muỗng canh (21 g)", en: "1 tbsp (21 g)", grams: 21 }] },
  { id: "coach-psyllium", category: "extras", vi: "Psyllium husk (vỏ hạt mã đề)", en: "Psyllium husk", estimate: true,
    coach: { ref: 32, brand: "Jcbluemoon", benefit: "Tiêu hoá" },
    per100: n(200, 1.5, 85, 0.6, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 1, 20, 20, 50, 50, 0.2, 0, 0.1),
    servings: [{ vi: "1 muỗng (5 g)", en: "1 scoop (5 g)", grams: 5 }] },
  { id: "coach-chia", category: "extras", vi: "Hạt chia", en: "Chia seeds", coach: { ref: 33, benefit: "Tiêu hoá" },
    per100: n(486, 16.5, 42.1, 30.7, 34.4, 0, 0, 0.5, 0, 1.6, 0.62, 0.17, 8.83, 0, 0, 49, 0, 631, 7.72, 335, 860, 407, 16, 4.58, 55.2, 0.92),
    servings: [{ vi: "1 muỗng canh (12 g)", en: "1 tbsp (12 g)", grams: 12 }] },
  { id: "coach-acv", category: "extras", vi: "Giấm táo", en: "Apple cider vinegar", coach: { ref: 35, brand: "Bragg's", benefit: "Tiêu hoá" },
    per100: n(21, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0.2, 5, 8, 73, 5, 0, 0, 0),
    servings: [{ vi: "1 muỗng canh (15 ml)", en: "1 tbsp (15 ml)", grams: 15 }] },
  { id: "coach-mint", category: "veg", vi: "Bạc hà", en: "Mint", coach: { ref: 36 },
    per100: n(70, 3.75, 14.9, 0.94, 8, 212, 0, 0, 0, 31.8, 0.08, 0.27, 1.7, 0.34, 0.13, 114, 0, 243, 5.08, 80, 73, 569, 31, 1.11, 0, 0.33),
    servings: [{ vi: "1 nắm (5 g)", en: "1 handful (5 g)", grams: 5 }] },
  { id: "coach-perilla", category: "veg", vi: "Tía tô", en: "Perilla", estimate: true, coach: { ref: 37 },
    per100: n(37, 3.9, 7, 0.1, 3.6, 880, 0, 3.9, 690, 26, 0.13, 0.34, 1, 1, 0.19, 110, 0, 230, 1.7, 70, 70, 500, 1, 1.3, 1, 0.2),
    servings: [{ vi: "1 nắm (5 g)", en: "1 handful (5 g)", grams: 5 }] },
  { id: "coach-basil", category: "veg", vi: "Húng quế", en: "Thai basil", coach: { ref: 38 },
    per100: n(23, 3.15, 2.65, 0.64, 1.6, 264, 0, 0.8, 414.8, 18, 0.03, 0.08, 0.9, 0.21, 0.16, 68, 0, 177, 3.17, 64, 56, 295, 4, 0.81, 0.3, 0.39),
    servings: [{ vi: "1 nắm (5 g)", en: "1 handful (5 g)", grams: 5 }] },
  { id: "coach-coconut-water", category: "dairy", vi: "Nước dừa", en: "Coconut water", coach: { ref: 39 },
    per100: n(19, 0.72, 3.7, 0.2, 1.1, 0, 0, 0, 0, 2.4, 0.03, 0.06, 0.08, 0.04, 0.03, 3, 0, 24, 0.29, 25, 20, 250, 105, 0.1, 1, 0.04),
    servings: [{ vi: "1 trái (300 ml)", en: "1 coconut (300 ml)", grams: 300 }, ml100] },
  { id: "coach-watermelon", category: "fruit", vi: "Dưa hấu", en: "Watermelon", coach: { ref: 40 },
    per100: n(30, 0.61, 7.55, 0.15, 0.4, 28, 0, 0.05, 0.1, 8.1, 0.03, 0.02, 0.18, 0.22, 0.05, 3, 0, 7, 0.24, 10, 11, 112, 1, 0.1, 0.4, 0.04),
    servings: [{ vi: "1 miếng (300 g)", en: "1 slice (300 g)", grams: 300 }, g100] },
  { id: "coach-cocoa", category: "extras", vi: "Cocoa (bột, không đường)", en: "Cocoa powder (unsweetened)", coach: { ref: "extra", benefit: "Thần kinh cơ" },
    per100: n(228, 19.6, 57.9, 13.7, 37, 0, 0, 0.1, 2.5, 0, 0.08, 0.24, 2.19, 0.25, 0.12, 32, 0, 128, 13.86, 499, 734, 1524, 21, 6.81, 14.3, 3.79),
    servings: [{ vi: "1 muỗng canh (5 g)", en: "1 tbsp (5 g)", grams: 5 }] },
  { id: "coach-algae", category: "extras", vi: "Tảo (spirulina)", en: "Algae (spirulina)", coach: { ref: "extra", benefit: "Trắng da / Thần kinh cơ" },
    per100: n(290, 57.5, 23.9, 7.7, 3.6, 29, 0, 5, 25.5, 10.1, 2.38, 3.67, 12.8, 3.48, 0.36, 94, 0, 120, 28.5, 195, 118, 1363, 1048, 2, 7.2, 6.1),
    servings: [{ vi: "1 muỗng (5 g)", en: "1 scoop (5 g)", grams: 5 }] },
];

// ---------------------------------------------------------------------------
// Live Fortify menu → foods
// ---------------------------------------------------------------------------

// The cut/part of the protein (e.g. "Ức", "Má đùi", "Cánh"), from the menu
// item's food subtype when one is set.
const cutOf = (item: MenuItem) => item.foodSubtype?.name || undefined;

function baseFor(item: MenuItem): Nutrients {
  if (item.protein === "BEEF") return FORTIFY_BASES.beef;
  if (item.protein === "SHRIMP") return FORTIFY_BASES.shrimp;
  const v = (cutOf(item) ?? "").toLowerCase();
  if (v.includes("đùi") || v.includes("dui") || v.includes("thigh")) return FORTIFY_BASES.chickenThigh;
  return FORTIFY_BASES.chickenBreast;
}

/** One food per live menu SKU, scaled from the protein base by box size. */
export function menuItemsToFoods(menuItems: MenuItem[]): Food[] {
  return menuItems.map((item) => {
    const name = [cutOf(item), item.flavor].filter(Boolean).join(" · ");
    return {
      id: `menu-${item.id}`,
      category: "fortify" as const,
      coach: item.protein === "BEEF" ? { ref: 13 } : undefined,
      vi: `${name} (${item.sizeGrams}g)`,
      en: `${name} (${item.sizeGrams}g)`,
      per100: baseFor(item),
      servings: [{ vi: `1 hộp (${item.sizeGrams} g)`, en: `1 box (${item.sizeGrams} g)`, grams: item.sizeGrams }, g100],
    };
  });
}

/** Fallback Fortify protein boxes when the live menu hasn't loaded. */
export const FORTIFY_FALLBACK_FOODS: Food[] = [
  { id: "fk-chicken", category: "fortify", vi: "Ức gà sous-vide Fortify", en: "Fortify sous-vide chicken breast", per100: FORTIFY_BASES.chickenBreast,
    servings: [{ vi: "1 hộp (150 g)", en: "1 box (150 g)", grams: 150 }, { vi: "1 hộp (250 g)", en: "1 box (250 g)", grams: 250 }] },
  { id: "fk-beef", category: "fortify", coach: { ref: 13 }, vi: "Bò sous-vide Fortify", en: "Fortify sous-vide beef", per100: FORTIFY_BASES.beef,
    servings: [{ vi: "1 hộp (150 g)", en: "1 box (150 g)", grams: 150 }] },
  { id: "fk-shrimp", category: "fortify", vi: "Tôm sous-vide Fortify", en: "Fortify sous-vide shrimp", per100: FORTIFY_BASES.shrimp,
    servings: [{ vi: "1 hộp (150 g)", en: "1 box (150 g)", grams: 150 }] },
];

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

export interface Food {
  id: string;
  category: FoodCategory;
  vi: string;
  en: string;
  per100: Nutrients;
  servings: Serving[];
  estimate?: boolean;
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
  { id: "fk-brown-rice", category: "fortify", vi: "Gạo lứt (phần Fortify)", en: "Brown rice (Fortify side)",
    per100: n(112, 2.3, 23.5, 0.8, 1.8, 0, 0, 0.03, 0.2, 0, 0.1, 0.01, 1.5, 0.4, 0.15, 4, 0, 10, 0.5, 44, 83, 79, 1, 0.6, 9.8, 0.1),
    servings: [{ vi: "1 phần (190 g)", en: "1 side (190 g)", grams: 190 }, g100] },
  { id: "fk-sweet-potato", category: "fortify", vi: "Khoai lang (phần Fortify)", en: "Sweet potato (Fortify side)",
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
  { id: "com-trang", category: "grains", vi: "Cơm trắng", en: "White rice (cooked)",
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
  { id: "khoai-tay", category: "grains", vi: "Khoai tây luộc", en: "Boiled potato",
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
  { id: "bo-nac", category: "protein", vi: "Thịt bò nạc (chín)", en: "Lean beef (cooked)",
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
  { id: "rau-muong", category: "veg", vi: "Rau muống xào", en: "Stir-fried water spinach", estimate: true,
    per100: n(60, 2.6, 3.5, 4.5, 2, 300, 0, 1.0, 250, 30, 0.05, 0.1, 0.9, 0.14, 0.1, 57, 0, 77, 1.7, 71, 39, 312, 300, 0.18, 0.9, 0.02),
    servings: [{ vi: "1 dĩa (150 g)", en: "1 plate (150 g)", grams: 150 }, g100] },
  { id: "cai-ngot", category: "veg", vi: "Cải ngọt/cải thìa luộc", en: "Boiled bok choy",
    per100: n(12, 1.6, 1.8, 0.2, 1, 210, 0, 0.1, 34, 26, 0.03, 0.06, 0.43, 0.08, 0.17, 41, 0, 93, 1.04, 11, 29, 371, 34, 0.17, 0.4, 0.02),
    servings: [{ vi: "1 dĩa (150 g)", en: "1 plate (150 g)", grams: 150 }, g100] },
  { id: "rau-bina", category: "veg", vi: "Cải bó xôi luộc", en: "Boiled spinach",
    per100: n(23, 3, 3.75, 0.26, 2.4, 524, 0, 2.1, 494, 9.8, 0.1, 0.24, 0.49, 0.15, 0.24, 146, 0, 136, 3.57, 87, 56, 466, 70, 0.76, 1.5, 0.17),
    servings: [{ vi: "1 chén (100 g)", en: "1 cup (100 g)", grams: 100 }] },
  { id: "bong-cai", category: "veg", vi: "Bông cải xanh luộc", en: "Boiled broccoli",
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
  { id: "nam-huong", category: "veg", vi: "Nấm hương nấu", en: "Cooked shiitake",
    per100: n(56, 1.6, 14.4, 0.2, 2.1, 0, 0.4, 0, 0, 0.3, 0.04, 0.17, 1.5, 3.6, 0.16, 21, 0, 3, 0.44, 14, 29, 117, 4, 1.33, 24.8, 0.9),
    servings: [{ vi: "1 phần (60 g)", en: "1 side (60 g)", grams: 60 }, g100] },

  // ---- Fruit ---------------------------------------------------------------
  { id: "chuoi", category: "fruit", vi: "Chuối", en: "Banana",
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
  { id: "du-du", category: "fruit", vi: "Đu đủ", en: "Papaya",
    per100: n(43, 0.47, 10.8, 0.26, 1.7, 47, 0, 0.3, 2.6, 60.9, 0.02, 0.03, 0.36, 0.19, 0.04, 37, 0, 20, 0.25, 21, 10, 182, 8, 0.08, 0.6, 0.05),
    servings: [{ vi: "1 chén (150 g)", en: "1 cup (150 g)", grams: 150 }, g100] },
  { id: "thanh-long", category: "fruit", vi: "Thanh long", en: "Dragon fruit", estimate: true,
    per100: n(60, 1.2, 13, 0.4, 3, 0, 0, 0.1, 4, 3, 0.04, 0.05, 0.16, 0.1, 0.04, 7, 0, 18, 0.74, 40, 22, 120, 0, 0.3, 0.5, 0.03),
    servings: [{ vi: "1/2 quả (200 g)", en: "1/2 fruit (200 g)", grams: 200 }, g100] },
  { id: "bo", category: "fruit", vi: "Bơ", en: "Avocado",
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
];

// ---------------------------------------------------------------------------
// Live Fortify menu → foods
// ---------------------------------------------------------------------------

function baseFor(item: MenuItem): Nutrients {
  if (item.protein === "BEEF") return FORTIFY_BASES.beef;
  if (item.protein === "SHRIMP") return FORTIFY_BASES.shrimp;
  const v = (item.variant ?? "").toLowerCase();
  if (v.includes("đùi") || v.includes("dui") || v.includes("thigh")) return FORTIFY_BASES.chickenThigh;
  return FORTIFY_BASES.chickenBreast;
}

/** One food per live menu SKU, scaled from the protein base by box size. */
export function menuItemsToFoods(menuItems: MenuItem[]): Food[] {
  return menuItems.map((item) => {
    const name = [item.variant, item.flavor].filter(Boolean).join(" · ");
    return {
      id: `menu-${item.id}`,
      category: "fortify" as const,
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
  { id: "fk-beef", category: "fortify", vi: "Bò sous-vide Fortify", en: "Fortify sous-vide beef", per100: FORTIFY_BASES.beef,
    servings: [{ vi: "1 hộp (150 g)", en: "1 box (150 g)", grams: 150 }] },
  { id: "fk-shrimp", category: "fortify", vi: "Tôm sous-vide Fortify", en: "Fortify sous-vide shrimp", per100: FORTIFY_BASES.shrimp,
    servings: [{ vi: "1 hộp (150 g)", en: "1 box (150 g)", grams: 150 }] },
];

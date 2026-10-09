// Nutrient definitions and daily targets (Nhu cầu dinh dưỡng khuyến nghị).
//
// Targets follow "Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam"
// (Viện Dinh dưỡng Quốc gia – Bộ Y tế, 2016) where those values were
// available: energy by age/sex/activity, protein 1.13 g/kg, fat ≤ 25% kcal,
// vitamins A, D, E, K, C, B3, B5, folate, and minerals Ca, Mg, P, Fe, Zn, Se.
// Gaps (B1, B2, B6, B12, fiber, potassium, sodium, copper) use FAO/WHO or
// IOM reference values. Each nutrient records which source its target uses.

export type NutrientKey =
  | "kcal" | "protein" | "carbs" | "fat" | "fiber"
  | "vitA" | "vitD" | "vitE" | "vitK" | "vitC"
  | "b1" | "b2" | "b3" | "b5" | "b6" | "b9" | "b12"
  | "calcium" | "iron" | "magnesium" | "phosphorus" | "potassium" | "sodium" | "zinc" | "selenium" | "copper";

export type NutrientGroup = "energy" | "vitamins" | "minerals";

export interface NutrientDef {
  key: NutrientKey;
  group: NutrientGroup;
  vi: string;
  en: string;
  unit: string;
  /** "min" = reach at least the target; "max" = stay under it (e.g. sodium). */
  kind: "min" | "max";
  source: "VN-2016" | "WHO" | "IOM" | "derived";
}

export const NUTRIENTS: NutrientDef[] = [
  { key: "kcal", group: "energy", vi: "Năng lượng", en: "Energy", unit: "kcal", kind: "min", source: "VN-2016" },
  { key: "protein", group: "energy", vi: "Chất đạm (Protein)", en: "Protein", unit: "g", kind: "min", source: "VN-2016" },
  { key: "carbs", group: "energy", vi: "Tinh bột (Carbs)", en: "Carbohydrates", unit: "g", kind: "min", source: "derived" },
  { key: "fat", group: "energy", vi: "Chất béo (Fat)", en: "Fat", unit: "g", kind: "max", source: "VN-2016" },
  { key: "fiber", group: "energy", vi: "Chất xơ", en: "Fiber", unit: "g", kind: "min", source: "WHO" },

  { key: "vitA", group: "vitamins", vi: "Vitamin A", en: "Vitamin A", unit: "µg", kind: "min", source: "VN-2016" },
  { key: "vitD", group: "vitamins", vi: "Vitamin D", en: "Vitamin D", unit: "µg", kind: "min", source: "VN-2016" },
  { key: "vitE", group: "vitamins", vi: "Vitamin E", en: "Vitamin E", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "vitK", group: "vitamins", vi: "Vitamin K", en: "Vitamin K", unit: "µg", kind: "min", source: "VN-2016" },
  { key: "vitC", group: "vitamins", vi: "Vitamin C", en: "Vitamin C", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "b1", group: "vitamins", vi: "Vitamin B1 (Thiamin)", en: "B1 (Thiamin)", unit: "mg", kind: "min", source: "WHO" },
  { key: "b2", group: "vitamins", vi: "Vitamin B2 (Riboflavin)", en: "B2 (Riboflavin)", unit: "mg", kind: "min", source: "WHO" },
  { key: "b3", group: "vitamins", vi: "Vitamin B3 (Niacin)", en: "B3 (Niacin)", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "b5", group: "vitamins", vi: "Vitamin B5", en: "B5 (Pantothenic acid)", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "b6", group: "vitamins", vi: "Vitamin B6", en: "B6 (Pyridoxine)", unit: "mg", kind: "min", source: "WHO" },
  { key: "b9", group: "vitamins", vi: "Folate (B9)", en: "Folate (B9)", unit: "µg", kind: "min", source: "VN-2016" },
  { key: "b12", group: "vitamins", vi: "Vitamin B12", en: "B12 (Cobalamin)", unit: "µg", kind: "min", source: "WHO" },

  { key: "calcium", group: "minerals", vi: "Canxi", en: "Calcium", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "iron", group: "minerals", vi: "Sắt", en: "Iron", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "magnesium", group: "minerals", vi: "Magie", en: "Magnesium", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "phosphorus", group: "minerals", vi: "Phốt pho", en: "Phosphorus", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "potassium", group: "minerals", vi: "Kali", en: "Potassium", unit: "mg", kind: "min", source: "WHO" },
  { key: "sodium", group: "minerals", vi: "Natri (giới hạn)", en: "Sodium (limit)", unit: "mg", kind: "max", source: "WHO" },
  { key: "zinc", group: "minerals", vi: "Kẽm", en: "Zinc", unit: "mg", kind: "min", source: "VN-2016" },
  { key: "selenium", group: "minerals", vi: "Selen", en: "Selenium", unit: "µg", kind: "min", source: "VN-2016" },
  { key: "copper", group: "minerals", vi: "Đồng", en: "Copper", unit: "mg", kind: "min", source: "IOM" },
];

export type Nutrients = Record<NutrientKey, number>;

export const ZERO_NUTRIENTS: Nutrients = NUTRIENTS.reduce((acc, n) => {
  acc[n.key] = 0;
  return acc;
}, {} as Nutrients);

// ---------------------------------------------------------------------------
// Profile → targets
// ---------------------------------------------------------------------------

export type Sex = "male" | "female";
export type Activity = "light" | "moderate" | "heavy";
/** RNI = 1.13 g/kg (VN 2016 minimum); gym = 1.6 g/kg; bulk = 2.0 g/kg. */
export type ProteinMode = "rni" | "gym" | "bulk";

export interface NutritionProfile {
  sex: Sex;
  age: number;
  weightKg: number;
  activity: Activity;
  proteinMode: ProteinMode;
}

export const DEFAULT_PROFILE: NutritionProfile = {
  sex: "male",
  age: 22,
  weightKg: 65,
  activity: "moderate",
  proteinMode: "gym",
};

type AgeBand = 0 | 1 | 2 | 3; // 20–29, 30–49, 50–69, 70+

function ageBand(age: number): AgeBand {
  if (age < 30) return 0;
  if (age < 50) return 1;
  if (age < 70) return 2;
  return 3;
}

// Bảng 6 – Nhu cầu năng lượng (kcal/ngày) by age band × activity.
const ENERGY: Record<Sex, Record<Activity, [number, number, number, number]>> = {
  male: {
    light: [2200, 2010, 2000, 1870],
    moderate: [2570, 2350, 2330, 2190],
    heavy: [2940, 2680, 2660, 2520],
  },
  female: {
    light: [1760, 1730, 1700, 1550],
    moderate: [2050, 2010, 1980, 1820],
    heavy: [2340, 2300, 2260, 2090],
  },
};

const PROTEIN_G_PER_KG: Record<ProteinMode, number> = { rni: 1.13, gym: 1.6, bulk: 2.0 };

type Banded = [number, number, number, number];
const byBand = (v: number): Banded => [v, v, v, v];

// Micronutrient targets per sex, indexed by age band.
const MICROS: Record<Sex, Partial<Record<NutrientKey, Banded>>> = {
  male: {
    vitA: [850, 900, 850, 800],
    vitD: [15, 15, 20, 20],
    vitE: byBand(6.5),
    vitK: byBand(150),
    vitC: byBand(100),
    b1: byBand(1.2),
    b2: byBand(1.3),
    b3: byBand(16),
    b5: byBand(5),
    b6: [1.3, 1.3, 1.7, 1.7],
    b9: byBand(400),
    b12: byBand(2.4),
    calcium: [800, 800, 800, 1000],
    iron: [11.9, 11.9, 11.9, 11], // 10% bioavailability diet
    magnesium: [340, 370, 350, 320],
    phosphorus: byBand(700),
    potassium: byBand(3510),
    sodium: byBand(2000),
    zinc: [10, 10, 10, 9], // moderate absorption
    selenium: [34, 34, 34, 33],
    copper: byBand(0.9),
    fiber: byBand(25),
  },
  female: {
    vitA: [650, 700, 700, 650],
    vitD: [15, 15, 20, 20],
    vitE: byBand(6),
    vitK: byBand(150),
    vitC: byBand(100),
    b1: byBand(1.1),
    b2: byBand(1.1),
    b3: byBand(14),
    b5: byBand(5),
    b6: [1.3, 1.3, 1.5, 1.5],
    b9: byBand(400),
    b12: byBand(2.4),
    calcium: [800, 800, 900, 1000],
    iron: [26.1, 26.1, 10, 9.4],
    magnesium: [270, 290, 290, 260],
    phosphorus: byBand(700),
    potassium: byBand(3510),
    sodium: byBand(2000),
    zinc: [8.4, 8.4, 8, 7],
    selenium: [26, 26, 26, 25],
    copper: byBand(0.9),
    fiber: byBand(25),
  },
};

export function computeTargets(p: NutritionProfile): Nutrients {
  const band = ageBand(p.age);
  const kcal = ENERGY[p.sex][p.activity][band];
  const protein = Math.round(p.weightKg * PROTEIN_G_PER_KG[p.proteinMode]);
  const fat = Math.round((kcal * 0.25) / 9); // ≤ 25% of energy
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  const targets = { ...ZERO_NUTRIENTS, kcal, protein, fat, carbs };
  const micros = MICROS[p.sex];
  for (const key of Object.keys(micros) as NutrientKey[]) {
    targets[key] = micros[key]![band];
  }
  return targets;
}

export function addNutrients(a: Nutrients, b: Nutrients, factor = 1): Nutrients {
  const out = { ...a };
  for (const n of NUTRIENTS) out[n.key] = a[n.key] + (b[n.key] ?? 0) * factor;
  return out;
}

export function formatAmount(value: number): string {
  if (value >= 100) return Math.round(value).toLocaleString("vi-VN");
  if (value >= 10) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

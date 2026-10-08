// Nutrient definitions and daily targets.
//
// Targets come from the coach's rules (docs/coach-food-list.md, section 5)
// wherever the coach gave a number: energy by goal (kcal/kg), protein,
// fat, carbs (remainder), fiber, potassium, sodium, calcium, magnesium,
// iron and zinc. Those drive the "running low" suggestions.
//
// Sodium follows the coach's salt rule: 4–6 g salt a day spread over meals,
// plus 1–1.5 g salt per 20 minutes of training on training days.
//
// Nutrients the coach did not give a number for (vitamins A, D, E, K, C,
// B-group, phosphorus, selenium, copper) are shown as reference values
// from the Vietnamese RDA (Viện Dinh dưỡng 2016; WHO/IOM for gaps). The
// coach flagged B1, B6, B9 and B12 as ones to watch, so those are marked.

export type NutrientKey =
  | "kcal" | "protein" | "carbs" | "fat" | "fiber"
  | "vitA" | "vitD" | "vitE" | "vitK" | "vitC"
  | "b1" | "b2" | "b3" | "b5" | "b6" | "b9" | "b12"
  | "calcium" | "iron" | "magnesium" | "phosphorus" | "potassium" | "sodium" | "zinc" | "selenium" | "copper";

/** energy = macros; electrolytes = coach minerals; reference = no coach number. */
export type NutrientGroup = "energy" | "electrolytes" | "reference";

export interface NutrientDef {
  key: NutrientKey;
  group: NutrientGroup;
  vi: string;
  en: string;
  unit: string;
  /** Coach named this nutrient as one to watch but gave no number. */
  coachWatch?: boolean;
}

export const NUTRIENTS: NutrientDef[] = [
  { key: "kcal", group: "energy", vi: "Năng lượng", en: "Energy", unit: "kcal" },
  { key: "protein", group: "energy", vi: "Chất đạm (Protein)", en: "Protein", unit: "g" },
  { key: "carbs", group: "energy", vi: "Tinh bột (Carbs)", en: "Carbohydrates", unit: "g" },
  { key: "fat", group: "energy", vi: "Chất béo (Fat)", en: "Fat", unit: "g" },
  { key: "fiber", group: "energy", vi: "Chất xơ", en: "Fiber", unit: "g" },

  { key: "potassium", group: "electrolytes", vi: "Kali (Potassium)", en: "Potassium", unit: "mg" },
  { key: "sodium", group: "electrolytes", vi: "Natri (Sodium)", en: "Sodium", unit: "mg" },
  { key: "calcium", group: "electrolytes", vi: "Canxi (Calcium)", en: "Calcium", unit: "mg" },
  { key: "magnesium", group: "electrolytes", vi: "Magie (Magnesium)", en: "Magnesium", unit: "mg" },
  { key: "iron", group: "electrolytes", vi: "Sắt (Iron)", en: "Iron", unit: "mg" },
  { key: "zinc", group: "electrolytes", vi: "Kẽm (Zinc)", en: "Zinc", unit: "mg" },

  { key: "b1", group: "reference", vi: "Vitamin B1", en: "B1 (Thiamin)", unit: "mg", coachWatch: true },
  { key: "b6", group: "reference", vi: "Vitamin B6", en: "B6 (Pyridoxine)", unit: "mg", coachWatch: true },
  { key: "b9", group: "reference", vi: "Folate (B9)", en: "Folate (B9)", unit: "µg", coachWatch: true },
  { key: "b12", group: "reference", vi: "Vitamin B12", en: "B12 (Cobalamin)", unit: "µg", coachWatch: true },
  { key: "b2", group: "reference", vi: "Vitamin B2", en: "B2 (Riboflavin)", unit: "mg" },
  { key: "b3", group: "reference", vi: "Vitamin B3", en: "B3 (Niacin)", unit: "mg" },
  { key: "b5", group: "reference", vi: "Vitamin B5", en: "B5 (Pantothenic acid)", unit: "mg" },
  { key: "vitA", group: "reference", vi: "Vitamin A", en: "Vitamin A", unit: "µg" },
  { key: "vitC", group: "reference", vi: "Vitamin C", en: "Vitamin C", unit: "mg" },
  { key: "vitD", group: "reference", vi: "Vitamin D", en: "Vitamin D", unit: "µg" },
  { key: "vitE", group: "reference", vi: "Vitamin E", en: "Vitamin E", unit: "mg" },
  { key: "vitK", group: "reference", vi: "Vitamin K", en: "Vitamin K", unit: "µg" },
  { key: "phosphorus", group: "reference", vi: "Phốt pho", en: "Phosphorus", unit: "mg" },
  { key: "selenium", group: "reference", vi: "Selen", en: "Selenium", unit: "µg" },
  { key: "copper", group: "reference", vi: "Đồng", en: "Copper", unit: "mg" },
];

export type Nutrients = Record<NutrientKey, number>;

export const ZERO_NUTRIENTS: Nutrients = NUTRIENTS.reduce((acc, n) => {
  acc[n.key] = 0;
  return acc;
}, {} as Nutrients);

/** A daily target: reach `min`; `max` (if set) is the top of the coach's range. */
export interface Target {
  min: number;
  max?: number;
  source: "coach" | "reference";
}

export type Targets = Record<NutrientKey, Target>;

// ---------------------------------------------------------------------------
// Profile → targets
// ---------------------------------------------------------------------------

export type Sex = "male" | "female";
export type Goal = "bulk" | "maintain" | "cut" | "deepCut";

export interface NutritionProfile {
  sex: Sex;
  age: number;
  weightKg: number;
  goal: Goal;
  /** Female only: near or during the period (coach: iron 28 mg instead of 18 mg). */
  onPeriod: boolean;
}

export const DEFAULT_PROFILE: NutritionProfile = {
  sex: "male",
  age: 22,
  weightKg: 65,
  goal: "maintain",
  onPeriod: false,
};

/** Fill in fields missing from older saved profiles. */
export function normalizeProfile(p: Partial<NutritionProfile> | null | undefined): NutritionProfile {
  const merged = { ...DEFAULT_PROFILE, ...(p ?? {}) };
  if (!["bulk", "maintain", "cut", "deepCut"].includes(merged.goal)) merged.goal = DEFAULT_PROFILE.goal;
  return merged;
}

export const GOALS: { id: Goal; vi: string; en: string; kcalPerKg: [number, number] }[] = [
  { id: "bulk", vi: "Phát triển", en: "Build", kcalPerKg: [35, 40] },
  { id: "maintain", vi: "Giữ", en: "Maintain", kcalPerKg: [30, 35] },
  { id: "cut", vi: "Cắt giảm", en: "Cut", kcalPerKg: [25, 30] },
  { id: "deepCut", vi: "Cắt giảm rất sâu", en: "Deep cut", kcalPerKg: [20, 25] },
];

// Coach rules (docs/coach-food-list.md §5).
const COACH = {
  proteinGPerKg: [1.6, 2.2] as const,
  fatGPerKg: [0.5, 1.0] as const,
  fiberGPer1000Kcal: 14,
  fiberG: { male: [30, 40], female: [20, 30] } as const,
  potassiumMgPerKg: [80, 100] as const,
  dailySaltG: [4, 6] as const,
  trainingSaltGPer20Min: [1, 1.5] as const,
  calciumMg: [1200, 1500] as const,
  magnesiumPctOfCalcium: 0.5,
  ironMg: { male: [8, 10], female: 18, femaleOnPeriod: 28 } as const,
  zincMg: { male: 12, female: 8 } as const,
};

type Banded = [number, number, number, number]; // 20–29, 30–49, 50–69, 70+
const byBand = (v: number): Banded => [v, v, v, v];

function ageBand(age: number): 0 | 1 | 2 | 3 {
  if (age < 30) return 0;
  if (age < 50) return 1;
  if (age < 70) return 2;
  return 3;
}

// Reference values (Viện Dinh dưỡng 2016; WHO/IOM where VN values were not available).
const REFERENCE: Record<Sex, Partial<Record<NutrientKey, Banded>>> = {
  male: {
    vitA: [850, 900, 850, 800], vitD: [15, 15, 20, 20], vitE: byBand(6.5), vitK: byBand(150), vitC: byBand(100),
    b1: byBand(1.2), b2: byBand(1.3), b3: byBand(16), b5: byBand(5), b6: [1.3, 1.3, 1.7, 1.7], b9: byBand(400), b12: byBand(2.4),
    phosphorus: byBand(700), selenium: [34, 34, 34, 33], copper: byBand(0.9),
  },
  female: {
    vitA: [650, 700, 700, 650], vitD: [15, 15, 20, 20], vitE: byBand(6), vitK: byBand(150), vitC: byBand(100),
    b1: byBand(1.1), b2: byBand(1.1), b3: byBand(14), b5: byBand(5), b6: [1.3, 1.3, 1.5, 1.5], b9: byBand(400), b12: byBand(2.4),
    phosphorus: byBand(700), selenium: [26, 26, 26, 25], copper: byBand(0.9),
  },
};

const r = Math.round;

/** Grams of salt (NaCl) → milligrams of sodium. */
export const SODIUM_MG_PER_G_SALT = 393;

/** Coach's training-day salt: 1–1.5 g per 20 minutes. */
export function trainingSaltG(minutes: number): [number, number] {
  const blocks = Math.max(0, minutes) / 20;
  return [COACH.trainingSaltGPer20Min[0] * blocks, COACH.trainingSaltGPer20Min[1] * blocks];
}

/** Coach's intra-workout fast carbs: 30–45 g per hour. */
export function trainingCarbsG(minutes: number): [number, number] {
  const hours = Math.max(0, minutes) / 60;
  return [30 * hours, 45 * hours];
}

/** `trainingMinutes` is today's session length (0 on rest days). */
export function computeTargets(p: NutritionProfile, trainingMinutes = 0): Targets {
  const w = p.weightKg;
  const goal = GOALS.find((g) => g.id === p.goal) ?? GOALS[1];
  const coach = (min: number, max?: number): Target => ({ min: r(min), max: max === undefined ? undefined : r(max), source: "coach" });

  const kcal = coach(goal.kcalPerKg[0] * w, goal.kcalPerKg[1] * w);
  const protein = coach(COACH.proteinGPerKg[0] * w, COACH.proteinGPerKg[1] * w);
  const fat = coach(COACH.fatGPerKg[0] * w, COACH.fatGPerKg[1] * w);

  // Carbs are whatever energy is left after protein and fat (coach: "phần còn lại").
  const proteinMid = (protein.min + protein.max!) / 2;
  const fatMid = (fat.min + fat.max!) / 2;
  const carbs = coach(
    Math.max(0, (kcal.min - proteinMid * 4 - fatMid * 9) / 4),
    Math.max(0, (kcal.max! - proteinMid * 4 - fatMid * 9) / 4),
  );

  // Fiber: 14 g per 1000 kcal, kept inside the coach's per-sex range.
  const [fLo, fHi] = COACH.fiberG[p.sex];
  const fiber = coach(Math.min(fHi, Math.max(fLo, (COACH.fiberGPer1000Kcal * (kcal.min + kcal.max!)) / 2 / 1000)), fHi);

  const potassium = coach(COACH.potassiumMgPerKg[0] * w, COACH.potassiumMgPerKg[1] * w);
  const [trainSaltMin, trainSaltMax] = trainingSaltG(trainingMinutes);
  const sodium = coach(
    (COACH.dailySaltG[0] + trainSaltMin) * SODIUM_MG_PER_G_SALT,
    (COACH.dailySaltG[1] + trainSaltMax) * SODIUM_MG_PER_G_SALT,
  );
  const calcium = coach(COACH.calciumMg[0], COACH.calciumMg[1]);
  const magnesium = coach(calcium.min * COACH.magnesiumPctOfCalcium, calcium.max! * COACH.magnesiumPctOfCalcium);
  const iron =
    p.sex === "male"
      ? coach(COACH.ironMg.male[0], COACH.ironMg.male[1])
      : coach(p.onPeriod ? COACH.ironMg.femaleOnPeriod : COACH.ironMg.female);
  const zinc = coach(COACH.zincMg[p.sex]);

  const band = ageBand(p.age);
  const ref = REFERENCE[p.sex];
  const reference = (key: NutrientKey): Target => ({ min: ref[key]?.[band] ?? 0, source: "reference" });

  return {
    kcal, protein, carbs, fat, fiber, potassium, sodium, calcium, magnesium, iron, zinc,
    vitA: reference("vitA"), vitD: reference("vitD"), vitE: reference("vitE"), vitK: reference("vitK"), vitC: reference("vitC"),
    b1: reference("b1"), b2: reference("b2"), b3: reference("b3"), b5: reference("b5"), b6: reference("b6"), b9: reference("b9"), b12: reference("b12"),
    phosphorus: reference("phosphorus"), selenium: reference("selenium"), copper: reference("copper"),
  };
}

export type TargetStatus = "low" | "near" | "ok" | "over";

export function targetStatus(value: number, t: Target): TargetStatus {
  if (t.min <= 0) return "ok";
  if (t.max !== undefined && value > t.max) return "over";
  const pct = value / t.min;
  if (pct >= 1) return "ok";
  if (pct >= 0.5) return "near";
  return "low";
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

export function formatTarget(t: Target): string {
  return t.max !== undefined && t.max !== t.min ? `${formatAmount(t.min)}–${formatAmount(t.max)}` : formatAmount(t.min);
}

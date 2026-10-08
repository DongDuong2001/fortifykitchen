"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faPlus,
  faTrash,
  faXmark,
  faMagnifyingGlass,
  faUserPen,
  faCopy,
  faLightbulb,
  faDumbbell,
} from "@fortawesome/free-solid-svg-icons";
import type { MenuItem } from "@fortifykitchen/types";
import {
  NUTRIENTS,
  ZERO_NUTRIENTS,
  DEFAULT_PROFILE,
  GOALS,
  computeTargets,
  normalizeProfile,
  targetStatus,
  addNutrients,
  formatAmount,
  formatTarget,
  type Nutrients,
  type NutrientGroup,
  type NutritionProfile,
  type Target,
  type Targets,
  type TargetStatus,
} from "./data/nutrients";
import { FOODS, FOOD_CATEGORIES, FORTIFY_FALLBACK_FOODS, menuItemsToFoods, type Food, type FoodCategory } from "./data/foods";

type Lang = "vi" | "en";
type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: { id: Meal; vi: string; en: string }[] = [
  { id: "breakfast", vi: "Bữa sáng", en: "Breakfast" },
  { id: "lunch", vi: "Bữa trưa", en: "Lunch" },
  { id: "dinner", vi: "Bữa tối", en: "Dinner" },
  { id: "snack", vi: "Bữa phụ", en: "Snacks" },
];

interface DiaryEntry {
  id: string;
  foodId: string;
  name: { vi: string; en: string };
  meal: Meal;
  grams: number;
  /** Snapshot so the entry still renders if the menu/food list changes. */
  per100: Nutrients;
}

type Diary = Record<string, DiaryEntry[]>;

const PROFILE_KEY = "fk.nutrition.profile.v1";
const DIARY_KEY = "fk.nutrition.diary.v1";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — tracker still works in memory */
  }
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function entryNutrients(e: DiaryEntry): Nutrients {
  return addNutrients(ZERO_NUTRIENTS, e.per100, e.grams / 100);
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const GROUP_TITLES: Record<NutrientGroup, { vi: string; en: string; noteVi: string; noteEn: string }> = {
  energy: {
    vi: "Năng lượng & Macro",
    en: "Energy & macros",
    noteVi: "Theo Coach. Carb: 50% là carb chậm. Fat: tối ưu (MUFA + PUFA) : SAT = 4 : 1.",
    noteEn: "Coach targets. Carbs: 50% slow carbs. Fat: aim for (MUFA + PUFA) : SAT = 4 : 1.",
  },
  electrolytes: {
    vi: "Điện giải & khoáng chất",
    en: "Electrolytes & minerals",
    noteVi: "Theo Coach. Sodium là nền tảng — thiếu sodium thì tất cả tầng điện giải gãy hết.",
    noteEn: "Coach targets. Sodium is the foundation of the electrolyte layer.",
  },
  reference: {
    vi: "Vitamin & vi chất (tham khảo)",
    en: "Vitamins & trace minerals (reference)",
    noteVi: "Coach chưa đưa con số — hiển thị mức khuyến nghị Viện Dinh dưỡng để tham khảo. Coach lưu ý B1, B6, B9, B12.",
    noteEn: "No coach numbers yet — shown against the Vietnamese RDA for reference. Coach flags B1, B6, B9, B12.",
  },
};

// Coach's workout-day amounts (docs/coach-food-list.md §2).
const TRAINING_TIPS: { vi: string; en: string; foodId?: string; grams?: number }[] = [
  { vi: "30 g chà là trước tập", en: "30 g dates before training", foodId: "coach-dates", grams: 30 },
  { vi: "1–2 g muối cho mỗi 20 phút trong tập", en: "1–2 g salt every 20 minutes of training" },
  { vi: "30–45 g carb với Redbull trong 1 giờ ở ngưỡng", en: "30–45 g carbs with Red Bull per hour at threshold" },
];

function barTone(status: TargetStatus, reference: boolean) {
  if (status === "ok") return reference ? "bg-emerald-500/60" : "bg-emerald-500";
  if (status === "over") return "bg-amber-500";
  if (status === "near") return reference ? "bg-amber-400/60" : "bg-amber-400";
  return reference ? "bg-rose-400/60" : "bg-rose-400";
}

function pctOf(value: number, t: Target) {
  return t.min > 0 ? (value / t.min) * 100 : 0;
}

interface NutritionSectionProps {
  lang: Lang;
  menuItems: MenuItem[];
}

export default function NutritionSection({ lang, menuItems }: NutritionSectionProps) {
  const L = (vi: string, en: string) => (lang === "vi" ? vi : en);

  const [loaded, setLoaded] = React.useState(false);
  const [profile, setProfile] = React.useState<NutritionProfile>(DEFAULT_PROFILE);
  const [diary, setDiary] = React.useState<Diary>({});
  const [day, setDay] = React.useState(() => dateKey(new Date()));
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [addingTo, setAddingTo] = React.useState<Meal | null>(null);

  // Load once on the client (localStorage isn't available during SSR).
  React.useEffect(() => {
    const storedProfile = readStorage<Partial<NutritionProfile> | null>(PROFILE_KEY, null);
    setProfile(normalizeProfile(storedProfile));
    setDiary(readStorage<Diary>(DIARY_KEY, {}));
    setProfileOpen(!storedProfile);
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (loaded) writeStorage(PROFILE_KEY, profile);
  }, [profile, loaded]);

  React.useEffect(() => {
    if (loaded) writeStorage(DIARY_KEY, diary);
  }, [diary, loaded]);

  const allFoods = React.useMemo<Food[]>(() => {
    const menuFoods = menuItems.length > 0 ? menuItemsToFoods(menuItems.filter((m) => m.isAvailable !== false)) : FORTIFY_FALLBACK_FOODS;
    return [...menuFoods, ...FOODS];
  }, [menuItems]);

  const entries = React.useMemo(() => diary[day] ?? [], [diary, day]);
  const targets = React.useMemo(() => computeTargets(profile), [profile]);
  const totals = React.useMemo(
    () => entries.reduce((acc, e) => addNutrients(acc, e.per100, e.grams / 100), { ...ZERO_NUTRIENTS }),
    [entries],
  );


  const addEntry = (food: Food, grams: number, meal: Meal) => {
    const entry: DiaryEntry = { id: newId(), foodId: food.id, name: { vi: food.vi, en: food.en }, meal, grams, per100: food.per100 };
    setDiary((d) => ({ ...d, [day]: [...(d[day] ?? []), entry] }));
  };

  const removeEntry = (id: string) => {
    setDiary((d) => ({ ...d, [day]: (d[day] ?? []).filter((e) => e.id !== id) }));
  };

  const yesterday = diary[shiftDate(day, -1)] ?? [];
  const copyYesterday = () => {
    if (yesterday.length === 0) return;
    setDiary((d) => ({ ...d, [day]: [...(d[day] ?? []), ...yesterday.map((e) => ({ ...e, id: newId() }))] }));
  };

  // Coach-targeted nutrients (plus the B vitamins the coach flagged) that are
  // furthest below target, each with the coach-list foods that supply the
  // most of it per normal serving. Only foods on the coach's list are used.
  const coachFoods = React.useMemo(() => allFoods.filter((f) => f.coach), [allFoods]);
  const gaps = React.useMemo(() => {
    if (entries.length === 0) return [];
    return NUTRIENTS.filter((n) => n.key !== "kcal" && n.key !== "carbs" && n.key !== "fat" && (targets[n.key].source === "coach" || n.coachWatch))
      .map((n) => ({ def: n, pct: pctOf(totals[n.key], targets[n.key]) }))
      .filter((g) => g.pct < 70)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 4)
      .map((g) => {
        const perServing = (f: Food) => (f.per100[g.def.key] * f.servings[0].grams) / 100;
        const picks = coachFoods
          .filter((f) => perServing(f) > 0)
          .sort((a, b) => perServing(b) - perServing(a))
          .slice(0, 3);
        return { ...g, picks };
      });
  }, [entries.length, totals, targets, coachFoods]);

  const isToday = day === dateKey(new Date());
  const dayLabel = (() => {
    const [y, m, d] = day.split("-").map(Number);
    const s = new Date(y, m - 1, d).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">{L("Nhật ký dinh dưỡng", "Nutrition tracker")}</h2>
        <p className="text-sm text-muted-foreground">
          {L(
            "Ghi lại bữa ăn mỗi ngày và so sánh calo, macro, điện giải, vitamin, khoáng chất với mục tiêu của Coach Fortify Kitchen.",
            "Log your meals each day and compare calories, macros, electrolytes, vitamins and minerals against the Fortify Kitchen coach's targets.",
          )}
        </p>
      </div>

      {/* Date + profile bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setDay(shiftDate(day, -1))} className="h-10 w-10 shrink-0 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center cursor-pointer" aria-label={L("Ngày trước", "Previous day")}>
            <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
          </button>
          <div className="px-4 h-10 rounded-xl border border-border bg-card flex items-center text-sm font-bold font-heading min-w-0">
            <span className="truncate">{isToday ? L("Hôm nay · ", "Today · ") : ""}{dayLabel}</span>
          </div>
          <button onClick={() => setDay(shiftDate(day, 1))} className="h-10 w-10 shrink-0 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center cursor-pointer" aria-label={L("Ngày sau", "Next day")}>
            <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
          </button>
          {!isToday && (
            <button onClick={() => setDay(dateKey(new Date()))} className="shrink-0 text-xs font-bold text-primary px-2 cursor-pointer">
              {L("Hôm nay", "Today")}
            </button>
          )}
        </div>
        <button onClick={() => setProfileOpen((o) => !o)} className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto">
          <FontAwesomeIcon icon={faUserPen} className="h-3.5 w-3.5 text-primary" />
          {profile.sex === "male" ? L("Nam", "Male") : L("Nữ", "Female")} · {profile.weightKg} kg ·{" "}
          {(() => {
            const g = GOALS.find((x) => x.id === profile.goal)!;
            return L(g.vi, g.en);
          })()}{" "}
          · {formatTarget(targets.kcal)} kcal
        </button>
      </div>

      {profileOpen && <ProfileEditor lang={lang} profile={profile} onChange={setProfile} onClose={() => setProfileOpen(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Diary */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          {entries.length === 0 && yesterday.length > 0 && (
            <button onClick={copyYesterday} className="w-full border border-dashed border-border rounded-2xl p-4 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center gap-2 cursor-pointer">
              <FontAwesomeIcon icon={faCopy} className="h-3.5 w-3.5" />
              {L(`Sao chép thực đơn hôm trước (${yesterday.length} món)`, `Copy the previous day's plan (${yesterday.length} items)`)}
            </button>
          )}
          {MEALS.map((meal) => {
            const mealEntries = entries.filter((e) => e.meal === meal.id);
            const mealKcal = mealEntries.reduce((s, e) => s + entryNutrients(e).kcal, 0);
            return (
              <div key={meal.id} className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
                  <h3 className="text-sm font-bold font-heading">{L(meal.vi, meal.en)}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{Math.round(mealKcal)} kcal</span>
                </div>
                {mealEntries.length > 0 && (
                  <ul className="divide-y divide-border/40">
                    {mealEntries.map((e) => {
                      const nut = entryNutrients(e);
                      return (
                        <li key={e.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{L(e.name.vi, e.name.en)}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {Math.round(e.grams)} g · P {nut.protein.toFixed(0)}g · C {nut.carbs.toFixed(0)}g · F {nut.fat.toFixed(0)}g
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold whitespace-nowrap">{Math.round(nut.kcal)} kcal</span>
                          <button onClick={() => removeEntry(e.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-muted flex items-center justify-center cursor-pointer" aria-label={L("Xoá", "Remove")}>
                            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button onClick={() => setAddingTo(meal.id)} className="w-full px-5 py-3 text-xs font-bold text-primary hover:bg-primary/5 flex items-center gap-2 cursor-pointer">
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                  {L("Thêm món", "Add food")}
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 min-w-0">
          <EnergySummary lang={lang} totals={totals} targets={targets} />

          {gaps.length > 0 && (
            <div className="border border-border/80 bg-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold font-heading">{L("Đang thiếu — Coach gợi ý bổ sung", "Running low — coach's picks")}</h3>
              </div>
              <ul className="space-y-4">
                {gaps.map((g) => (
                  <li key={g.def.key} className="text-xs space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>{L(g.def.vi, g.def.en)}</span>
                      <span className="font-mono text-rose-500">{Math.round(g.pct)}%</span>
                    </div>
                    <ul className="space-y-1">
                      {g.picks.map((f) => (
                        <li key={f.id} className="flex items-baseline justify-between gap-3 text-muted-foreground">
                          <span className="min-w-0">
                            <span className="text-foreground">{L(f.vi, f.en)}</span>
                            {f.coach?.brand && <span> · {f.coach.brand}</span>}
                            {f.coach?.benefit && <span className="text-primary"> · {f.coach.benefit}</span>}
                          </span>
                          <span className="font-mono whitespace-nowrap">
                            +{formatAmount((f.per100[g.def.key] * f.servings[0].grams) / 100)} {g.def.unit} / {L(f.servings[0].vi, f.servings[0].en)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border border-border/80 bg-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faDumbbell} className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold font-heading">{L("Ngày tập — theo Coach", "Training day — coach's rules")}</h3>
            </div>
            <ul className="space-y-2 text-xs">
              {TRAINING_TIPS.map((tip) => {
                const food = tip.foodId ? allFoods.find((f) => f.id === tip.foodId) : undefined;
                return (
                  <li key={tip.vi} className="flex items-center justify-between gap-3">
                    <span>{L(tip.vi, tip.en)}</span>
                    {food && tip.grams && (
                      <button
                        onClick={() => addEntry(food, tip.grams!, "snack")}
                        className="shrink-0 text-[11px] font-bold text-primary px-2 py-1 rounded-lg hover:bg-primary/5 cursor-pointer"
                      >
                        + {L("Bữa phụ", "Snack")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Nutrient targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["energy", "electrolytes", "reference"] as NutrientGroup[]).map((group) => (
          <div key={group} className="border border-border/80 bg-card rounded-2xl p-5 space-y-4 min-w-0">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading">{L(GROUP_TITLES[group].vi, GROUP_TITLES[group].en)}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{L(GROUP_TITLES[group].noteVi, GROUP_TITLES[group].noteEn)}</p>
            </div>
            <ul className="space-y-3">
              {NUTRIENTS.filter((n) => n.group === group).map((n) => {
                const t = targets[n.key];
                const p = pctOf(totals[n.key], t);
                const status = targetStatus(totals[n.key], t);
                return (
                  <li key={n.key} className="space-y-1">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="font-medium truncate">
                        {L(n.vi, n.en)}
                        {n.coachWatch && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">Coach</span>}
                      </span>
                      <span className="font-mono text-muted-foreground whitespace-nowrap">
                        {formatAmount(totals[n.key])} / {formatTarget(t)} {n.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barTone(status, t.source === "reference")}`} style={{ width: `${Math.min(100, p)}%` }} />
                      </div>
                      <span className={`w-10 text-right text-[11px] font-mono font-bold ${status === "over" ? "text-amber-600" : ""}`}>{Math.round(p)}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-3xl">
        {L(
          "Mục tiêu năng lượng, macro, chất xơ và điện giải theo hướng dẫn của Coach Fortify Kitchen. Vitamin và vi chất khác hiển thị theo Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (Viện Dinh dưỡng, 2016) để tham khảo. Gợi ý thực phẩm chỉ lấy từ danh sách của Coach. Giá trị dinh dưỡng của thực phẩm là ước tính dựa trên USDA FoodData Central. Nhật ký được lưu trên thiết bị này. Thông tin chỉ mang tính tham khảo, không thay thế tư vấn y tế — phụ nữ mang thai, cho con bú hoặc người có bệnh lý cần hỏi ý kiến bác sĩ.",
          "Energy, macro, fiber and electrolyte targets follow the Fortify Kitchen coach's guidance. Other vitamins and minerals are shown against the Vietnamese RDA (National Institute of Nutrition, 2016) for reference. Food suggestions come only from the coach's list. Food values are estimates based on USDA FoodData Central. Your diary is saved on this device. For general guidance only, not medical advice — if pregnant, breastfeeding or managing a health condition, check with your doctor.",
        )}
      </p>

      {addingTo && (
        <AddFoodModal
          lang={lang}
          meal={addingTo}
          foods={allFoods}
          onAdd={(food, grams) => {
            addEntry(food, grams, addingTo);
            setAddingTo(null);
          }}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EnergySummary({ lang, totals, targets }: { lang: Lang; totals: Nutrients; targets: Targets }) {
  const L = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const kcal = targets.kcal;
  const kcalPct = kcal.min > 0 ? Math.min(1, totals.kcal / kcal.min) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const toMin = Math.round(kcal.min - totals.kcal);
  const overMax = Math.round(totals.kcal - (kcal.max ?? kcal.min));

  const macros = [
    { key: "protein" as const, label: "Protein", color: "bg-primary" },
    { key: "carbs" as const, label: L("Tinh bột", "Carbs"), color: "bg-sky-500" },
    { key: "fat" as const, label: L("Chất béo", "Fat"), color: "bg-amber-500" },
    { key: "fiber" as const, label: L("Chất xơ", "Fiber"), color: "bg-emerald-500" },
  ];

  return (
    <div className="border border-border/80 bg-card rounded-2xl p-5 space-y-5 shadow-sm">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-primary transition-all"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - kcalPct)}
          />
        </svg>
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">{L("Năng lượng", "Energy")}</span>
          <p className="text-2xl font-extrabold font-heading">
            {Math.round(totals.kcal)} <span className="text-sm font-medium text-muted-foreground">/ {formatTarget(kcal)} kcal</span>
          </p>
          <p className={`text-xs font-bold ${overMax > 0 ? "text-amber-600" : toMin > 0 ? "text-muted-foreground" : "text-emerald-600"}`}>
            {overMax > 0
              ? L(`Vượt ${overMax} kcal`, `${overMax} kcal over`)
              : toMin > 0
                ? L(`Còn ${toMin} kcal`, `${toMin} kcal to go`)
                : L("Đạt mục tiêu", "On target")}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {macros.map((m) => {
          const p = pctOf(totals[m.key], targets[m.key]);
          return (
            <div key={m.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold">{m.label}</span>
                <span className="font-mono text-muted-foreground">
                  {totals[m.key].toFixed(0)} / {formatTarget(targets[m.key])} g
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${Math.min(100, p)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProfileEditor({ lang, profile, onChange, onClose }: { lang: Lang; profile: NutritionProfile; onChange: (p: NutritionProfile) => void; onClose: () => void }) {
  const L = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const set = <K extends keyof NutritionProfile>(k: K, v: NutritionProfile[K]) => onChange({ ...profile, [k]: v });

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted"}`;

  return (
    <div className="border border-border/80 bg-card rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold font-heading">{L("Thông tin của bạn", "Your profile")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{L("Dùng để tính mục tiêu theo cân nặng, giới tính và mục tiêu tập luyện (theo Coach).", "Used to set your targets from weight, sex and training goal (coach's rules).")}</p>
        </div>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer" aria-label={L("Đóng", "Close")}>
          <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <span className="text-xs font-bold">{L("Giới tính", "Sex")}</span>
          <div className="flex gap-2">
            <button className={chip(profile.sex === "male")} onClick={() => set("sex", "male")}>{L("Nam", "Male")}</button>
            <button className={chip(profile.sex === "female")} onClick={() => set("sex", "female")}>{L("Nữ", "Female")}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className="text-xs font-bold">{L("Tuổi", "Age")}</span>
            <input
              type="number"
              min={18}
              max={100}
              value={profile.age}
              onChange={(e) => set("age", Math.max(18, Math.min(100, Number(e.target.value) || 18)))}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold">{L("Cân nặng (kg)", "Weight (kg)")}</span>
            <input
              type="number"
              min={30}
              max={200}
              value={profile.weightKg}
              onChange={(e) => set("weightKg", Math.max(30, Math.min(200, Number(e.target.value) || 30)))}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold">{L("Mục tiêu", "Goal")}</span>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g.id} className={chip(profile.goal === g.id)} onClick={() => set("goal", g.id)}>
                {L(g.vi, g.en)} <span className="font-mono font-normal text-muted-foreground">{g.kcalPerKg[0]}–{g.kcalPerKg[1]} kcal/kg</span>
              </button>
            ))}
          </div>
        </div>
        {profile.sex === "female" && (
          <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer self-end">
            <input type="checkbox" checked={profile.onPeriod} onChange={(e) => set("onPeriod", e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            {L("Gần tới kỳ hoặc đang trong kỳ (sắt 28 mg)", "Near or during period (iron 28 mg)")}
          </label>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AddFoodModal({ lang, meal, foods, onAdd, onClose }: { lang: Lang; meal: Meal; foods: Food[]; onAdd: (food: Food, grams: number) => void; onClose: () => void }) {
  const L = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<FoodCategory | "all" | "coach">("all");
  const [selected, setSelected] = React.useState<Food | null>(null);
  const [servingIdx, setServingIdx] = React.useState(0);
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => {
    const onKey = (e: { key: string }) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const results = React.useMemo(() => {
    const q = normalize(query.trim());
    const inCategory = (f: Food) => category === "all" || (category === "coach" ? !!f.coach : f.category === category);
    return foods.filter((f) => inCategory(f) && (!q || normalize(f.vi).includes(q) || normalize(f.en).includes(q)));
  }, [foods, query, category]);

  const serving = selected?.servings[servingIdx];
  const grams = serving ? serving.grams * qty : 0;
  const preview = selected ? addNutrients(ZERO_NUTRIENTS, selected.per100, grams / 100) : ZERO_NUTRIENTS;
  const mealName = MEALS.find((m) => m.id === meal)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-lg max-h-[90vh] bg-card border border-border rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h3 className="text-sm font-bold font-heading">
            {L("Thêm vào", "Add to")} {L(mealName.vi, mealName.en).toLowerCase()}
          </h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer" aria-label={L("Đóng", "Close")}>
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="px-5 pt-4 space-y-3">
              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={L("Tìm món: cơm, phở, trứng, ức gà…", "Search: rice, phở, egg, chicken…")}
                  className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {[{ id: "all" as const, vi: "Tất cả", en: "All" }, { id: "coach" as const, vi: "Coach khuyên dùng", en: "Coach's picks" }, ...FOOD_CATEGORIES].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer ${category === c.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                  >
                    {L(c.vi, c.en)}
                  </button>
                ))}
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 py-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">{L("Không tìm thấy món phù hợp.", "No matching foods.")}</li>}
              {results.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => {
                      setSelected(f);
                      setServingIdx(0);
                      setQty(1);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="text-sm">
                      {L(f.vi, f.en)}
                      {f.category === "fortify" && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-primary">Fortify</span>}
                      {f.coach && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-amber-600">Coach</span>}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {Math.round((f.per100.kcal * f.servings[0].grams) / 100)} kcal / {L(f.servings[0].vi, f.servings[0].en)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto">
            <button onClick={() => setSelected(null)} className="text-xs font-bold text-primary flex items-center gap-1.5 cursor-pointer">
              <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" /> {L("Chọn món khác", "Pick another food")}
            </button>
            <div>
              <p className="text-base font-bold font-heading">{L(selected.vi, selected.en)}</p>
              {selected.coach && (
                <p className="text-[11px] mt-1">
                  <span className="font-bold text-amber-600">Coach</span>
                  {selected.coach.brand && <span className="text-muted-foreground"> · {selected.coach.brand}</span>}
                  {selected.coach.note && <span className="text-muted-foreground"> · {selected.coach.note}</span>}
                  {selected.coach.benefit && <span className="text-primary"> · {selected.coach.benefit}</span>}
                </p>
              )}
              {selected.estimate && <p className="text-[11px] text-muted-foreground mt-1">{L("Giá trị ước tính theo công thức phổ biến.", "Estimated from a typical recipe.")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-xs font-bold">{L("Khẩu phần", "Serving")}</span>
                <select value={servingIdx} onChange={(e) => setServingIdx(Number(e.target.value))} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm">
                  {selected.servings.map((s, i) => (
                    <option key={i} value={i}>
                      {L(s.vi, s.en)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold">{L("Số lượng", "Quantity")}</span>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={qty}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "kcal", value: Math.round(preview.kcal) },
                { label: "Protein", value: `${preview.protein.toFixed(1)}g` },
                { label: L("Carb", "Carbs"), value: `${preview.carbs.toFixed(1)}g` },
                { label: L("Béo", "Fat"), value: `${preview.fat.toFixed(1)}g` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-muted/60 py-3">
                  <p className="text-sm font-bold font-mono">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
            <button
              disabled={grams <= 0}
              onClick={() => onAdd(selected, grams)}
              className="w-full bg-primary hover:bg-primary/95 disabled:opacity-40 text-primary-foreground text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
              {L(`Thêm ${Math.round(grams)} g`, `Add ${Math.round(grams)} g`)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

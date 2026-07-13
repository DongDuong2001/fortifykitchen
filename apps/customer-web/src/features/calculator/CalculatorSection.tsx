"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { formatVND } from "@fortifykitchen/shared";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

const PROTEIN_OPTIONS = [
  {
    id: "chicken",
    label: "Ức gà (Chicken)",
    sizes: {
      150: { pro: 37, carb: 0, fat: 3, kcal: 175, price: 25000 },
      250: { pro: 61, carb: 0, fat: 5, kcal: 290, price: 42000 }
    }
  },
  {
    id: "beef",
    label: "Thịt bò (Beef)",
    sizes: {
      150: { pro: 35, carb: 0, fat: 12, kcal: 250, price: 50000 }
    }
  },
  {
    id: "shrimp",
    label: "Tôm thẻ (Shrimp)",
    sizes: {
      150: { pro: 32, carb: 0, fat: 2, kcal: 150, price: 50000 }
    }
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

interface CalculatorSectionProps {
  lang: "vi" | "en";
}

export default function CalculatorSection({ lang }: CalculatorSectionProps) {
  const [customProtein, setCustomProtein] = React.useState<string>("chicken");
  const [customSize, setCustomSize] = React.useState<number>(150);
  const [customCarb, setCustomCarb] = React.useState<string>("rice");
  const [customToppings, setCustomToppings] = React.useState<string[]>(["broccoli"]);
  const [customSauce, setCustomSauce] = React.useState<string>("sesame");

  React.useEffect(() => {
    if (customProtein !== "chicken") {
      setCustomSize(150);
    }
  }, [customProtein]);

  const calculateCustomMacros = () => {
    const PROTEIN_SPECS: Record<string, Record<number, { pro: number; carb: number; fat: number; kcal: number; price: number }>> = {
      chicken: { 150: { pro: 37, carb: 0, fat: 3, kcal: 175, price: 25000 }, 250: { pro: 61, carb: 0, fat: 5, kcal: 290, price: 42000 } },
      beef: { 150: { pro: 35, carb: 0, fat: 12, kcal: 250, price: 50000 } },
      shrimp: { 150: { pro: 32, carb: 0, fat: 2, kcal: 150, price: 50000 } },
    };

    const CARB_SPECS: Record<string, { pro: number; carb: number; fat: number; kcal: number; price: number }> = {
      rice: { pro: 4, carb: 45, fat: 1.5, kcal: 210, price: 10000 },
      potato: { pro: 2, carb: 26, fat: 0.2, kcal: 115, price: 12000 },
      noodle: { pro: 3, carb: 40, fat: 1, kcal: 180, price: 10000 },
    };

    const TOPPING_SPECS: Record<string, { pro: number; carb: number; fat: number; kcal: number; price: number }> = {
      broccoli: { pro: 2.5, carb: 6, fat: 0.3, kcal: 35, price: 5000 },
      egg: { pro: 6, carb: 0.6, fat: 5, kcal: 70, price: 8000 },
      mushroom: { pro: 2, carb: 5, fat: 0.2, kcal: 30, price: 7000 },
    };

    const SAUCE_SPECS: Record<string, { pro: number; carb: number; fat: number; kcal: number; price: number }> = {
      sesame: { pro: 1, carb: 5, fat: 6, kcal: 78, price: 5000 },
      citrus: { pro: 0, carb: 10, fat: 0, kcal: 40, price: 5000 },
      spicy: { pro: 0.5, carb: 4, fat: 0.5, kcal: 22, price: 5000 },
    };

    const pOpt = PROTEIN_SPECS[customProtein] || PROTEIN_SPECS.chicken;
    const p = pOpt[customSize as 150 | 250] || pOpt[150];
    const c = CARB_SPECS[customCarb] || CARB_SPECS.rice;
    const s = SAUCE_SPECS[customSauce] || SAUCE_SPECS.sesame;

    let proVal = p.pro + c.pro + s.pro;
    let carbVal = p.carb + c.carb + s.carb;
    let fatVal = p.fat + c.fat + s.fat;
    let kcalVal = p.kcal + c.kcal + s.kcal;
    let priceVal = 10000 + p.price + c.price + s.price;

    for (const t of customToppings) {
      const topOpt = TOPPING_SPECS[t];
      if (topOpt) {
        proVal += topOpt.pro;
        carbVal += topOpt.carb;
        fatVal += topOpt.fat;
        kcalVal += topOpt.kcal;
        priceVal += topOpt.price;
      }
    }

    return {
      pro: parseFloat(proVal.toFixed(1)),
      carb: parseFloat(carbVal.toFixed(1)),
      fat: parseFloat(fatVal.toFixed(1)),
      kcal: Math.round(kcalVal),
      price: priceVal,
    };
  };

  const macros = calculateCustomMacros();

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
          {t("nav_calculator", lang)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("nav_calculator", lang) === "Calculator" 
            ? "Select your protein, complex carbs, and clean sauces to calculate live Calories, Protein, Carbs and Fat values." 
            : "Tự chọn nguồn đạm, tinh bột phức và xốt để tính lượng Calories, Protein, Carbs và Fat tức thời."}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Selector Columns */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Protein Selection */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold font-heading flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">1</span>
              {t("nav_calculator", lang) === "Calculator" ? "Select Protein" : "Chọn Nguồn Đạm (Protein)"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {PROTEIN_OPTIONS.map((opt) => {
                const sizeSpecs = opt.sizes[customSize as 150 | 250] || opt.sizes[150];
                return (
                  <button
                    key={opt.id}
                    onClick={() => setCustomProtein(opt.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      customProtein === opt.id
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold font-heading">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      {sizeSpecs.pro}g Pro · {sizeSpecs.fat}g Fat · {sizeSpecs.kcal} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1.5. Portion Size Selection */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold font-heading flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">1.5</span>
              {t("nav_calculator", lang) === "Calculator" ? "Select Portion" : "Chọn Định Lượng (Portion)"}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setCustomSize(150)}
                className={`px-6 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  customSize === 150
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                150g
              </button>
              <button
                disabled={customProtein !== "chicken"}
                onClick={() => setCustomSize(250)}
                className={`px-6 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  customSize === 250
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                250g {customProtein !== "chicken" && (t("nav_calculator", lang) === "Calculator" ? "(Chicken only)" : "(Chỉ có cho Gà)")}
              </button>
            </div>
          </div>

          {/* 2. Carb Selection */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold font-heading flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">2</span>
              {t("nav_calculator", lang) === "Calculator" ? "Select Carbohydrates" : "Chọn Tinh Bột (Carbohydrates)"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {CARB_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCustomCarb(opt.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    customCarb === opt.id
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="text-xs font-bold font-heading">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    {opt.carb}g Carb · {opt.kcal} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Toppings Selection */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold font-heading flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">3</span>
              {t("nav_calculator", lang) === "Calculator" ? "Select Sides & Toppings" : "Chọn Rau củ & Topping ăn kèm"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {TOPPING_OPTIONS.map((opt) => {
                const isSelected = customToppings.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (isSelected) {
                        setCustomToppings(customToppings.filter((t) => t !== opt.id));
                      } else {
                        setCustomToppings([...customToppings, opt.id]);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold font-heading">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      +{opt.kcal} kcal · +{formatVND(opt.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Sauce Selection */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold font-heading flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">4</span>
              {t("nav_calculator", lang) === "Calculator" ? "Select Clean Sauce" : "Chọn Xốt Dinh Dưỡng"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {SAUCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCustomSauce(opt.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    customSauce === opt.id
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="text-xs font-bold font-heading">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    +{opt.kcal} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculator Live Panel */}
        <div className="lg:col-span-4 border border-border/80 bg-card rounded-2xl p-6 space-y-6 shadow-sm sticky top-24">
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em] font-sans">
              {t("nav_calculator", lang) === "Calculator" ? "Macros Dashboard" : "Bảng chỉ số dinh dưỡng"}
            </span>
            <h3 className="text-lg font-bold font-heading">
              {t("nav_calculator", lang) === "Calculator" ? "Your Custom Plate" : "Đĩa Ăn Tự Chọn"}
            </h3>
          </div>

          <div className="border-t border-border/30 pt-4 flex flex-col gap-3 font-mono text-xs text-secondary">
            <div className="flex justify-between items-center">
              <span className="tracking-wider">PROTEIN</span>
              <span className="font-bold text-foreground">{macros.pro}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="tracking-wider">CARBS</span>
              <span className="font-bold text-foreground">{macros.carb}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="tracking-wider">FAT</span>
              <span className="font-bold text-foreground">{macros.fat}g</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
              <span className="tracking-wider font-bold">CALORIES</span>
              <span className="font-bold text-primary text-base">{macros.kcal} kcal</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
              <span className="tracking-wider font-bold">{t("nav_calculator", lang) === "Calculator" ? "PRICE" : "GIÁ TIỀN"}</span>
              <span className="font-bold text-foreground text-sm">{formatVND(macros.price)}</span>
            </div>
          </div>

          <button
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            {t("nav_calculator", lang) === "Calculator" ? "Add Combo to Cart" : "Thêm Combo vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}
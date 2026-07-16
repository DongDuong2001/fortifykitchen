"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { getMenuItemLabel, PROTEIN_LABELS, formatVND } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

function groupByFlavor(items: MenuItem[]) {
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

function getSelectedSize(dish: { protein: Protein; flavor: string; sizes: MenuItem[] }, selectedSizeByDish: Record<string, string>): MenuItem {
  const key = `${dish.protein}::${dish.flavor}`;
  const selectedId = selectedSizeByDish[key];
  return dish.sizes.find((s) => s.id === selectedId) ?? dish.sizes[0];
}

interface MenuSectionProps {
  lang: "vi" | "en";
  menuItems: MenuItem[];
  isLoadingMenu: boolean;
  selectedProtein: Protein | "";
  setSelectedProtein: (protein: Protein | "") => void;
  addToCart: (item: MenuItem, qty: number, flavorOverride?: string, lang?: "vi" | "en") => void;
}

export default function MenuSection({ lang, menuItems, isLoadingMenu, selectedProtein, setSelectedProtein, addToCart }: MenuSectionProps) {
  const [selectedSizeByDish, setSelectedSizeByDish] = React.useState<Record<string, string>>({});

  const proteinsPresent = (Object.keys(PROTEIN_LABELS) as Protein[]).filter((p) =>
    menuItems.some((item) => item.protein === p)
  );

  const filteredMenu = selectedProtein
    ? menuItems.filter((item) => item.protein === selectedProtein)
    : menuItems;

  const groupedMenu = proteinsPresent
    .filter((p) => !selectedProtein || p === selectedProtein)
    .map((protein) => ({
      protein,
      dishes: groupByFlavor(filteredMenu.filter((item) => item.protein === protein)),
    }));

  if (isLoadingMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <FontAwesomeIcon icon={faUtensils} className="h-10 w-10 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">
          {t("menu_title", lang)}
        </span>
      </div>
    );
  }

  if (filteredMenu.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl">
        <FontAwesomeIcon icon={faSearch} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground font-medium">
          {t("menu_subtitle", lang)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            {t("menu_title", lang)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("menu_subtitle", lang)}
          </p>
        </div>

        {/* Protein Filter */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedProtein("")}
            className={`px-4 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              selectedProtein === ""
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/40 border-border hover:bg-muted"
            }`}
          >
            {t("filter_all", lang)}
          </button>
          {proteinsPresent.map((protein) => (
            <button
              key={protein}
              onClick={() => setSelectedProtein(protein)}
              className={`px-4 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                selectedProtein === protein
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-muted/40 border-border hover:bg-muted"
              }`}
            >
              {t(`filter_${protein}` as keyof Dictionary, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="space-y-10">
        {groupedMenu.map(({ protein, dishes }) => (
          <div key={protein} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-muted-foreground">
                {t(`filter_${protein}` as keyof Dictionary, lang)}
              </h3>
              <span className="text-xs font-mono text-muted-foreground">({dishes.length})</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {dishes.map((dish) => {
                const dishKey = `${dish.protein}::${dish.flavor}`;
                const selected = getSelectedSize(dish, selectedSizeByDish);
                return (
                  <div
                    key={dishKey}
                    className="group flex flex-col justify-between border border-border hover:border-primary/50 bg-card rounded-lg overflow-hidden transition-all"
                  >
                    <div>
                      {/* Image placeholder with premium styling */}
                      <div className="h-48 w-full bg-muted/40 flex items-center justify-center border-b border-border overflow-hidden relative">
                        {selected.imageUrl ? (
                          <img
                            src={selected.imageUrl}
                            alt={getMenuItemLabel(selected)}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-muted-foreground/30" />
                        )}
                        <span className="absolute top-4 right-4 bg-primary text-primary-foreground font-mono text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                          {formatVND(selected.price)}
                        </span>
                        <span
                          className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                            (selected.stockQuantity ?? 0) > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {(selected.stockQuantity ?? 0) > 0
                            ? t("unit_stock", lang)
                            : t("btn_out_of_stock", lang)}
                        </span>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-bold font-heading mb-2 leading-tight group-hover:text-primary transition-colors">
                          {dish.flavor}
                        </h3>
                        {selected.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                            {selected.description}
                          </p>
                        )}
                        {dish.sizes.length > 1 && (
                          <div className="flex gap-1.5">
                            {dish.sizes.map((size) => (
                              <button
                                key={size.id}
                                onClick={() =>
                                  setSelectedSizeByDish((prev) => ({ ...prev, [dishKey]: size.id }))
                                }
                                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                                  selected.id === size.id
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-muted/40 border-border hover:bg-muted"
                                }`}
                              >
                                {size.sizeGrams}g
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-3">
                      <button
                        onClick={() => addToCart(selected, 1, undefined, lang)}
                        className="w-full btn-primary py-3 text-xs tracking-wider uppercase font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        {t("btn_add_cart", lang)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faSeedling,
  faDrumstickBite,
  faTruckFast,
  faCartShopping,
  faBowlFood,
  faBoxOpen,
  faUsers,
  faUtensils,
  faBacon,
  faFish,
  faStar,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { MenuItem } from "@fortifykitchen/types";
import { getMenuItemLabel, formatVND } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";
import Link from "next/link";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface HomeSectionProps {
  lang: "vi" | "en";
  menuItems: MenuItem[];
  setActiveTab: (tab: string) => void;
  addToCart: (item: MenuItem, qty: number, flavorOverride?: string, lang?: "vi" | "en") => void;
  homeFrames?: any[];
  isLoadingHomeFrames?: boolean;
}

const whyFortify = [
  { icon: faFire, titleKey: "home_why_slow", descKey: "home_why_slow_desc", number: "16+ Hrs" },
  { icon: faSeedling, titleKey: "home_why_fresh", descKey: "home_why_fresh_desc", number: "Daily" },
  { icon: faDrumstickBite, titleKey: "home_why_protein", descKey: "home_why_protein_desc", number: "40g+" },
  { icon: faTruckFast, titleKey: "home_why_delivery", descKey: "home_why_delivery_desc", number: "30-45'" },
] as const;

const categories = [
  { icon: faDrumstickBite, labelKey: "filter_CHICKEN", href: "?protein=CHICKEN", count: "12+" },
  { icon: faBacon, labelKey: "filter_BEEF", href: "?protein=BEEF", count: "8+" },
  { icon: faFish, labelKey: "filter_SHRIMP", href: "?protein=SHRIMP", count: "6+" },
  { icon: faBoxOpen, labelKey: "home_cat_mealbox", href: "/meal-boxes", count: "4+" },
  { icon: faUsers, labelKey: "home_cat_family", href: "/family-packs", count: "3+" },
  { icon: faUtensils, labelKey: "home_cat_chef", href: "/chef-specials", count: "5+" },
] as const;

const howItWorks = [
  { icon: faCartShopping, titleKey: "home_how_step1", descKey: "home_how_step1_desc", number: "01" },
  { icon: faFire, titleKey: "home_how_step2", descKey: "home_how_step2_desc", number: "02" },
  { icon: faTruckFast, titleKey: "home_how_step3", descKey: "home_how_step3_desc", number: "03" },
  { icon: faBowlFood, titleKey: "home_how_step4", descKey: "home_how_step4_desc", number: "04" },
] as const;

export default function HomeSection({ lang, menuItems, setActiveTab, addToCart, homeFrames = [], isLoadingHomeFrames = false }: HomeSectionProps) {
  // Filter exactly one Chicken, one Beef, and one Shrimp dish for best sellers representation
  const featuredItems = React.useMemo(() => {
    const chicken = menuItems.find((item) => item.protein === "CHICKEN");
    const beef = menuItems.find((item) => item.protein === "BEEF");
    const shrimp = menuItems.find((item) => item.protein === "SHRIMP");
    const list: MenuItem[] = [];
    if (chicken) list.push(chicken);
    if (beef) list.push(beef);
    if (shrimp) list.push(shrimp);
    // Fallback if database is empty or missing specific proteins
    if (list.length < 3) {
      const rest = menuItems.filter((item) => !list.includes(item));
      list.push(...rest.slice(0, 3 - list.length));
    }
    return list;
  }, [menuItems]);

  const [currentFrameIndex, setCurrentFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (homeFrames.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % homeFrames.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [homeFrames]);

  // Determine active banner details
  const hasFrames = homeFrames.length > 0;
  const currentFrame = hasFrames ? homeFrames[currentFrameIndex] : null;

  return (
    <div className="space-y-0">
      {/* 2. HERO — Centered editorial layout with image below */}
      <section className="relative pt-4 pb-12 md:pt-6 md:pb-16 overflow-hidden bg-background">
        <div className="container-design relative z-10 w-full text-center">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
              {currentFrame?.title || t("home_hero_badge", lang)}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground uppercase leading-tight font-heading max-w-2xl">
              {t("home_hero_title", lang)}
            </h1>

            <p className="body-text text-muted-foreground max-w-xl mx-auto">
              {t("home_hero_subtitle", lang)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              <button
                onClick={() => setActiveTab("menu")}
                className="btn-primary inline-flex items-center justify-center min-w-[160px] py-3.5 px-6 text-sm cursor-pointer"
              >
                <span className="whitespace-nowrap">{t("home_hero_cta_menu", lang)}</span>
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 ml-2 shrink-0" />
              </button>
              <button
                onClick={() => setActiveTab("order-now")}
                className="btn-secondary inline-flex items-center justify-center min-w-[160px] py-3.5 px-6 text-sm whitespace-nowrap cursor-pointer"
              >
                {t("home_hero_cta_order", lang)}
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-4 w-full text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTruckFast} className="h-4 w-4 text-primary" />
                <span>{t("home_trust_delivery", lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-accent" />
                <span>{t("home_trust_macro", lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFire} className="h-4 w-4 text-secondary" />
                <span>{t("home_trust_sousvide", lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSeedling} className="h-4 w-4 text-primary" />
                <span>{t("home_trust_fresh", lang)}</span>
              </div>
            </div>
          </div>

          {/* Big horizontal dynamic visual below the text content */}
          <div className="mt-12 md:mt-16 max-w-5xl mx-auto relative px-4">
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl bg-card border border-border">
              {isLoadingHomeFrames ? (
                <div className="w-full h-full bg-card animate-pulse flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/60">Loading banners...</span>
                </div>
              ) : hasFrames ? (
                <div className="w-full h-full relative transition-all duration-700">
                  {currentFrame.linkUrl ? (
                    <a href={currentFrame.linkUrl} className="block w-full h-full">
                      <img
                        src={currentFrame.imageUrl}
                        alt={currentFrame.title || t("home_hero_image_alt", lang)}
                        className="w-full h-full object-contain md:object-cover transition-transform duration-500 hover:scale-102"
                      />
                    </a>
                  ) : (
                    <img
                      src={currentFrame.imageUrl}
                      alt={currentFrame.title || t("home_hero_image_alt", lang)}
                      className="w-full h-full object-contain md:object-cover"
                    />
                  )}
                  {/* Slider Indicators */}
                  {homeFrames.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {homeFrames.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentFrameIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentFrameIndex ? "bg-primary w-6" : "bg-white/50 hover:bg-white"
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1600"
                  alt={t("home_hero_image_alt", lang)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY FORTIFY KITCHEN — Four feature cards */}
      <section className="section bg-background" aria-labelledby="why-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faFire} className="h-3 w-3" />
              {t("home_why_label", lang)}
            </span>
            <h2 id="why-heading" className="text-2xl md:text-3xl font-extrabold text-foreground font-heading">
              {t("home_why_title", lang)}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("home_why_subtitle", lang)}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Box 1 (Nấu chậm) - Chiếm 2 cột (col-span-2) trên màn hình trung bình trở lên để tạo điểm nhấn chính */}
            <article className="group relative p-8 md:p-10 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 md:col-span-2 flex flex-col justify-between text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <FontAwesomeIcon icon={whyFortify[0].icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading">{t(whyFortify[0].titleKey, lang)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(whyFortify[0].descKey, lang)}</p>
                </div>
                <div className="text-primary font-heading font-bold text-3xl md:text-5xl tabular-nums self-end md:self-start opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                  {whyFortify[0].number}
                </div>
              </div>
            </article>

            {/* Box 2 (Nguyên liệu tươi) - Chiếm 1 cột */}
            <article className="group relative p-8 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                  <FontAwesomeIcon icon={whyFortify[1].icon} className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-heading">{t(whyFortify[1].titleKey, lang)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(whyFortify[1].descKey, lang)}</p>
              </div>
              <div className="text-primary font-heading font-bold text-3xl tabular-nums opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                {whyFortify[1].number}
              </div>
            </article>

            {/* Box 3 (Protein cao) - Chiếm 1 cột */}
            <article className="group relative p-8 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                  <FontAwesomeIcon icon={whyFortify[2].icon} className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-heading">{t(whyFortify[2].titleKey, lang)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(whyFortify[2].descKey, lang)}</p>
              </div>
              <div className="text-primary font-heading font-bold text-3xl tabular-nums opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                {whyFortify[2].number}
              </div>
            </article>

            {/* Box 4 (Giao hàng) - Chiếm 2 cột (col-span-2) để cân bằng bố cục lưới */}
            <article className="group relative p-8 md:p-10 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 md:col-span-2 flex flex-col justify-between text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <FontAwesomeIcon icon={whyFortify[3].icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading">{t(whyFortify[3].titleKey, lang)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(whyFortify[3].descKey, lang)}</p>
                </div>
                <div className="text-primary font-heading font-bold text-3xl md:text-5xl tabular-nums self-end md:self-start opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                  {whyFortify[3].number}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. BEST SELLERS — Three-column layout */}
      <section className="section bg-background" aria-labelledby="bestsellers-heading">
        <div className="container-design">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
                <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                {t("home_bestsellers_label", lang)}
              </span>
              <h2 id="bestsellers-heading" className="headline-section text-foreground">
                {t("home_bestsellers_title", lang)}
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("menu")}
              className="btn-secondary self-end whitespace-nowrap"
            >
              {t("home_bestsellers_cta", lang)}
              <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5 ml-2" />
            </button>
          </header>

          <div className="card-grid gap-8">
            {featuredItems.map((item) => (
              <article
                key={item.id}
                className="group relative bg-card border border-border/70 hover:border-primary/40 hover:shadow-card-hover transition-all duration-500 rounded-[24px] overflow-hidden flex flex-col justify-between"
              >
                {/* Image Section with hover zoom scale */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={getMenuItemLabel(item)}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                    loading="lazy"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background/90 text-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm border border-border/40 select-none">
                    {t(`filter_${item.protein}` as keyof Dictionary, lang)}
                  </span>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow justify-between space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-bold text-foreground font-heading line-clamp-1 group-hover:text-primary transition-colors duration-300">
                        {getMenuItemLabel(item)}
                      </h3>
                      <span className="text-lg font-bold text-primary font-heading shrink-0 tabular-nums">
                        {formatVND(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Scientific Macro Label layout */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground font-sans">
                    <div className="flex flex-col items-center justify-center text-center border-r border-border/40">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Protein</span>
                      <span className="font-bold text-foreground mt-0.5 tabular-nums">~35g</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border-r border-border/40">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Calories</span>
                      <span className="font-bold text-foreground mt-0.5 tabular-nums">~250 kcal</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Trọng lượng</span>
                      <span className="font-bold text-foreground mt-0.5 tabular-nums">{item.sizeGrams}g</span>
                    </div>
                  </div>

                  {/* Add to cart action button */}
                  <button
                    onClick={() => addToCart(item, 1, undefined, lang)}
                    className="w-full btn-primary py-3 text-xs tracking-wider uppercase font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t("btn_add_cart", lang)}</span>
                    <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CATEGORIES — Horizontal pills scroll layout */}
      <section className="section bg-background" aria-labelledby="categories-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faBoxOpen} className="h-3 w-3" />
              {t("home_cat_label", lang)}
            </span>
            <h2 id="categories-heading" className="text-2xl md:text-3xl font-extrabold text-foreground font-heading">
              {t("home_cat_title", lang)}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("home_cat_subtitle", lang)}
            </p>
          </header>

          {/* Horizontally scrollable list on mobile, wraps on desktop */}
          <div className="flex overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:justify-center gap-4 max-w-4xl mx-auto scrollbar-none snap-x snap-mandatory px-4">
            {categories.map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="group flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300 select-none shrink-0 snap-center"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <FontAwesomeIcon icon={cat.icon} className="h-3.5 w-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 whitespace-nowrap">{t(cat.labelKey, lang)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{cat.count} {t("home_cat_items", lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS — Interactive Timeline Card Grid */}
      <section className="section bg-background border-t border-border/30" aria-labelledby="how-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faFire} className="h-3 w-3" />
              {t("home_how_label", lang)}
            </span>
            <h2 id="how-heading" className="text-2xl md:text-3xl font-extrabold text-foreground font-heading">
              {t("home_how_title", lang)}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("home_how_subtitle", lang)}
            </p>
          </header>

          <div className="max-w-4xl mx-auto relative">
            {/* Visual connector line */}
            <div className="hidden md:block absolute left-[31px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-primary/35 via-border to-transparent" />

            <div className="space-y-8">
              {howItWorks.map((step, i) => (
                <article
                  key={i}
                  className="group flex flex-col md:flex-row gap-6 items-start relative z-10 p-6 md:p-8 rounded-3xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <FontAwesomeIcon icon={step.icon} className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border/80 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {step.number}
                    </span>
                  </div>
                  <div className="space-y-2 text-left pt-1">
                    <h3 className="text-base md:text-lg font-bold text-foreground font-heading">{t(step.titleKey, lang)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans max-w-xl">{t(step.descKey, lang)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
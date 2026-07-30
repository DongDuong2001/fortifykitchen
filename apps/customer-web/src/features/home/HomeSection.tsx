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
  faStar,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { MenuItem } from "@fortifykitchen/types";
import { getMenuItemLabel, formatVND } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";
import AddToCartButton from "@/components/AddToCartButton";

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
  { icon: faFire, titleKey: "home_why_slow", descKey: "home_why_slow_desc", number: "Nấu chậm" },
  { icon: faSeedling, titleKey: "home_why_fresh", descKey: "home_why_fresh_desc", number: "Daily" },
  { icon: faDrumstickBite, titleKey: "home_why_protein", descKey: "home_why_protein_desc", number: "40g+" },
  { icon: faTruckFast, titleKey: "home_why_delivery", descKey: "home_why_delivery_desc", number: "Giao nhanh" },
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
      {/* 2. HERO — "THE NUTRITION PILL" Bố cục Pill & Split Layout */}
      <section className="relative pt-2 pb-12 md:pt-4 md:pb-16 overflow-hidden bg-transparent">
        {/* Top Info Ticker Bar */}
        <div className="max-w-7xl mx-auto mb-8 overflow-hidden px-4">
          <div className="ticker-container rounded-full bg-primary/5 border border-primary/10 py-3 px-6 shadow-sm">
            <div className="ticker-track text-primary text-xs sm:text-sm font-semibold tracking-wide">
              <span className="flex items-center gap-2">✔ Protein chuẩn ISO</span>
              <span className="flex items-center gap-2">✔ Giao hàng đúng giờ</span>
              <span className="flex items-center gap-2">✔ Nguồn gốc rõ ràng</span>
              <span className="flex items-center gap-2">✔ Chế biến Sous-vide</span>
              <span className="flex items-center gap-2">✔ Macro minh bạch</span>
              <span className="flex items-center gap-2">✔ Nguyên liệu tươi mới</span>
              <span className="flex items-center gap-2">✔ Protein chuẩn ISO</span>
              <span className="flex items-center gap-2">✔ Giao hàng đúng giờ</span>
              <span className="flex items-center gap-2">✔ Nguồn gốc rõ ràng</span>
              <span className="flex items-center gap-2">✔ Chế biến Sous-vide</span>
              <span className="flex items-center gap-2">✔ Macro minh bạch</span>
              <span className="flex items-center gap-2">✔ Nguyên liệu tươi mới</span>
            </div>
          </div>
        </div>

        {/* Hero Pill Split Grid */}
        <div className="container-design relative z-10 w-full">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr,0.7fr] gap-8 items-center">
            
            {/* KHỐI NỘI DUNG CHÍNH (PILL 1) */}
            <div className="bg-card p-8 sm:p-10 lg:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-card border border-border/80 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2.5 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full w-fit">
                  <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary text-xs font-bold tracking-wide uppercase">
                    {currentFrame?.title || t("home_hero_badge", lang)}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-foreground leading-[1.1] uppercase font-heading">
                  {t("home_hero_title", lang)}
                </h1>

                <p className="body-text text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                  {t("home_hero_subtitle", lang)}
                </p>
              </div>

              <div className="pt-2 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="btn-primary rounded-full inline-flex items-center justify-center py-3.5 px-7 text-sm font-bold tracking-wider uppercase cursor-pointer shadow-lg hover:scale-102 transition-all"
                  >
                    <span>{t("home_hero_cta_menu", lang)} &gt;</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("order-now")}
                    className="btn-secondary rounded-full inline-flex items-center justify-center py-3.5 px-7 text-sm font-bold tracking-wider uppercase whitespace-nowrap cursor-pointer transition-all"
                  >
                    {t("home_hero_cta_order", lang)}
                  </button>
                </div>

                {/* Trust indicators inside content pill */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/40 text-xs text-muted-foreground font-semibold">
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
                </div>
              </div>
            </div>

            {/* KHỐI HÌNH ẢNH GỌN GÀNG, NỊNH MẮT (PILL 2) */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/4.5] w-full max-w-md mx-auto lg:max-w-none overflow-hidden rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-border/80 bg-card group flex items-center justify-center">
              {isLoadingHomeFrames ? (
                <div className="w-full h-full bg-card animate-pulse flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/60">Loading banner...</span>
                </div>
              ) : hasFrames ? (
                <div className="w-full h-full relative transition-all duration-700">
                  {currentFrame.linkUrl ? (
                    <a href={currentFrame.linkUrl} className="block w-full h-full">
                      <img
                        src={currentFrame.imageUrl}
                        alt={currentFrame.title || t("home_hero_image_alt", lang)}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-103"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1600";
                        }}
                      />
                    </a>
                  ) : (
                    <img
                      src={currentFrame.imageUrl}
                      alt={currentFrame.title || t("home_hero_image_alt", lang)}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1600";
                      }}
                    />
                  )}
                  {/* Slider Indicators */}
                  {homeFrames.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                      {homeFrames.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentFrameIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === currentFrameIndex ? "bg-primary w-5" : "bg-white/60 hover:bg-white"
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
                  className="w-full h-full object-cover object-center"
                />
              )}

              {/* Gentle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none rounded-3xl sm:rounded-[2.5rem]" />

              {/* Top Right Floating Glassmorphism Nutrition Badge */}
              <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-white/60 text-center animate-bounce-short pointer-events-none select-none">
                <p className="text-xl font-black text-primary font-mono leading-none">45g</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Protein</p>
              </div>

              {/* Bottom Left Micro Badge */}
              <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full shadow-md border border-white/60 text-center pointer-events-none select-none hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-foreground">Slow-Cooked 16h</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY FORTIFY KITCHEN — Four feature cards */}
      <section className="section bg-transparent" aria-labelledby="why-heading">
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
      <section className="section bg-transparent" aria-labelledby="bestsellers-heading">
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
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400";
                    }}
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
                  <div className="w-full flex justify-center">
                    <AddToCartButton
                      text={t("btn_add_cart", lang)}
                      onClick={() => addToCart(item, 1, undefined, lang)}
                      className="w-full max-w-none justify-center"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS — Interactive Timeline Card Grid */}
      <section className="section bg-transparent border-t border-border/30" aria-labelledby="how-heading">
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

      {/* 6. FAQ — Interactive Accordion replacing Categories, placed below How It Works */}
      <section className="section bg-transparent border-t border-border/30" aria-labelledby="faq-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
              FAQ
            </span>
            <h2 id="faq-heading" className="text-2xl md:text-3xl font-extrabold text-foreground font-heading">
              {lang === "vi" ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {lang === "vi" ? "Giải đáp thắc mắc về thực đơn, giao hàng và các gói hội viên" : "Answers to common questions about menu, delivery, and plans"}
            </p>
          </header>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: lang === "vi" ? "Làm thế nào để đặt hàng giao ngay?" : "How do I place a quick delivery order?",
                a: lang === "vi" ? "Bạn chỉ cần chọn tab 'Giao ngay' trên thanh điều hướng, lựa chọn món ăn và nhập thông tin địa chỉ để chúng tôi giao bữa ăn nóng hổi nhanh nhất có thể mà không cần đăng ký tài khoản." : "Simply switch to the 'Ready Now' tab, pick your meals, and fill in your delivery details. We will deliver hot meals as fast as possible without requiring an account."
              },
              {
                q: lang === "vi" ? "Gói hội viên Protein hoạt động như thế nào?" : "How do subscription packages work?",
                a: lang === "vi" ? "Khi mua gói hội viên, bạn sẽ nhận được một lượng hạn mức Protein tương ứng. Bạn có thể sử dụng hạn mức này để thiết lập và nhận cơm văn phòng theo tuần/tháng tự động qua ví mà không cần thanh toán lẻ từng bữa." : "By purchasing a subscription, you receive a specific Protein credit. You can use this credit to schedule and receive weekly or monthly meals automatically without manual payment each time."
              },
              {
                q: lang === "vi" ? "Tôi có thể thay đổi lịch giao hàng hoặc món ăn không?" : "Can I change my delivery schedule or meals?",
                a: lang === "vi" ? "Hoàn toàn được. Đối với đơn hàng định kỳ, quản trị viên sẽ hỗ trợ bạn điều chỉnh món ăn hoặc hoãn lịch giao nếu bạn báo trước ít nhất 1 ngày qua hotline hoặc cổng hỗ trợ." : "Yes. For subscription orders, our support team can help you modify your dishes or pause delivery schedules if you notify us at least 1 day in advance via our hotline."
              },
              {
                q: lang === "vi" ? "Bữa ăn của Fortify Kitchen được chế biến như thế nào?" : "How are Fortify Kitchen meals prepared?",
                a: lang === "vi" ? "Tất cả thịt (ức gà, thăn bò, tôm) của chúng tôi đều được nấu bằng kỹ thuật Sous-vide (nấu chậm chân không) giữ trọn vẹn vị ngọt, sự mềm mọng nguyên bản cùng hàm lượng protein chuẩn xác ghi trên nhãn." : "All proteins (chicken breast, beef, shrimp) are cooked using the Sous-vide technique (slow low-temperature vacuum cooking) to retain juices, flavor, and exact nutritional macros."
              }
            ].map((item, idx) => {
              const FAQItem = () => {
                const [isOpen, setIsOpen] = React.useState(false);
                return (
                  <div className="border border-border/80 rounded-2xl bg-card transition-all duration-300">
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="w-full px-6 py-4.5 text-left flex justify-between items-center gap-4 font-bold text-xs md:text-sm text-foreground cursor-pointer bg-transparent border-0 outline-none"
                    >
                      <span>{item.q}</span>
                      <span className={`text-primary transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}>
                        <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4.5 text-xs text-muted-foreground leading-relaxed border-t border-border/20 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              };
              return <FAQItem key={idx} />;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
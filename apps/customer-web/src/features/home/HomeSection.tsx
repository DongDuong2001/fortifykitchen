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
  faCheckCircle,
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

export default function HomeSection({ lang, menuItems, setActiveTab, addToCart }: HomeSectionProps) {
  const featuredItems = menuItems.slice(0, 3);

  return (
    <div className="space-y-0">
      {/* 2. HERO — Large editorial layout */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="container-design relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div className="space-y-8 lg:pr-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
                <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                {t("home_hero_badge", lang)}
              </span>

              <h1 className="headline-hero text-foreground">
                {t("home_hero_title", lang)}
              </h1>

              <p className="body-text text-muted-foreground max-w-lg">
                {t("home_hero_subtitle", lang)}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="btn-primary w-full sm:w-auto"
                >
                  {t("home_hero_cta_menu", lang)}
                  <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5 ml-2" />
                </button>
                <button
                  onClick={() => setActiveTab("order-now")}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {t("home_hero_cta_order", lang)}
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-border">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTruckFast} className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("home_trust_delivery", lang)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-foreground">{t("home_trust_macro", lang)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faFire} className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-foreground">{t("home_trust_sousvide", lang)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSeedling} className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("home_trust_fresh", lang)}</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative">
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-[40px] overflow-hidden shadow-card-hover bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200"
                  alt={t("home_hero_image_alt", lang)}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating organic decorations */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-6 -right-6 w-20 h-20 opacity-20" aria-hidden="true">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5 C45 15 55 25 50 35 C45 25 55 15 50 5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M50 35 C45 45 55 55 50 65 C45 55 55 45 50 35" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M50 65 C45 75 55 85 50 95 C45 85 55 75 50 65" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="absolute bottom-8 left-4 w-16 h-16 opacity-15 rotate-12" aria-hidden="true">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="50" cy="70" rx="25" ry="15" stroke="#6D4C41" strokeWidth="2"/>
                    <path d="M25 70 Q50 40 75 70" stroke="#6D4C41" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M35 65 Q50 50 65 65" stroke="#6D4C41" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="absolute top-1/2 right-2 w-12 h-12 opacity-10 -rotate-6" aria-hidden="true">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 L65 45 L35 45 Z" stroke="#F6C453" strokeWidth="3" strokeLinejoin="round"/>
                    <circle cx="50" cy="50" r="8" stroke="#F6C453" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY FORTIFY KITCHEN — Four feature cards */}
      <section className="section bg-background" aria-labelledby="why-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faFire} className="h-3 w-3" />
              {t("home_why_label", lang)}
            </span>
            <h2 id="why-heading" className="headline-section text-foreground">
              {t("home_why_title", lang)}
            </h2>
            <p className="body-text text-muted-foreground">
              {t("home_why_subtitle", lang)}
            </p>
          </header>

          <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {whyFortify.map((item, i) => (
              <article
                key={i}
                className="group relative p-8 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 text-center space-y-5"
              >
                <div className="relative w-16 h-16 mx-auto rounded-[20px] bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <FontAwesomeIcon icon={item.icon} className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="headline-card text-foreground">{t(item.titleKey, lang)}</h3>
                  <p className="body-sm">{t(item.descKey, lang)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-2xl font-bold text-primary font-heading tabular-nums">{item.number}</span>
                </div>
              </article>
            ))}
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

          <div className="card-grid">
            {featuredItems.map((item) => (
              <article
                key={item.id}
                className="product-card group relative bg-card border border-border rounded-[28px] overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={getMenuItemLabel(item)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-input bg-primary/90 text-primary-foreground text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {t(`filter_${item.protein}` as keyof Dictionary, lang)}
                  </span>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" aria-label="Add to favorites">
                      <FontAwesomeIcon icon={faStar} className="h-5 w-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" aria-label="Quick view">
                      <FontAwesomeIcon icon={faUtensils} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="headline-card text-foreground">{getMenuItemLabel(item)}</h3>
                      <p className="body-sm mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-primary font-heading shrink-0 tabular-nums">{formatVND(item.price)}</span>
                  </div>

<div className="flex items-center gap-4 pt-3 border-t border-border/50 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faDrumstickBite} className="h-4 w-4" />
                        ~35g Protein
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faFire} className="h-4 w-4 text-accent" />
                        ~250 kcal
                      </span>
                      <span className="flex items-center gap-1.5 ml-auto">
                        <FontAwesomeIcon icon={faUtensils} className="h-4 w-4" />
                        {item.sizeGrams}g
                      </span>
                    </div>

                  <button
                    onClick={() => addToCart(item, 1, undefined, lang)}
                    className="w-full btn-primary py-3"
                  >
                    {t("btn_add_cart", lang)}
                    <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CATEGORIES */}
      <section className="section bg-background" aria-labelledby="categories-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faBoxOpen} className="h-3 w-3" />
              {t("home_cat_label", lang)}
            </span>
            <h2 id="categories-heading" className="headline-section text-foreground">
              {t("home_cat_title", lang)}
            </h2>
            <p className="body-text text-muted-foreground">
              {t("home_cat_subtitle", lang)}
            </p>
          </header>

          <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="group relative p-6 rounded-[24px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 text-center space-y-4 text-left"
              >
                <div className="relative w-14 h-14 mx-auto rounded-[16px] bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <FontAwesomeIcon icon={cat.icon} className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">{t(cat.labelKey, lang)}</h3>
                  <p className="text-sm text-muted-foreground">{cat.count} {t("home_cat_items", lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS — Three-step process */}
      <section className="section bg-background" aria-labelledby="how-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faFire} className="h-3 w-3" />
              {t("home_how_label", lang)}
            </span>
            <h2 id="how-heading" className="headline-section text-foreground">
              {t("home_how_title", lang)}
            </h2>
            <p className="body-text text-muted-foreground">
              {t("home_how_subtitle", lang)}
            </p>
          </header>

          <div className="relative">
            <div className="hidden lg:block absolute top-[80px] left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-transparent via-border/50 to-transparent" aria-hidden="true" />

            <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {howItWorks.map((step, i) => (
                <article
                  key={i}
                  className="relative text-center space-y-6 p-6"
                >
                  <div className="relative">
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold uppercase tracking-wider font-heading">
                      {step.number}
                    </span>
                    <div className="relative w-16 h-16 mx-auto rounded-[16px] bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                      <FontAwesomeIcon icon={step.icon} className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <h3 className="headline-card text-foreground">{t(step.titleKey, lang)}</h3>
                    <p className="body-sm">{t(step.descKey, lang)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans — Price Cards */}
      <section className="section bg-background" aria-labelledby="plans-heading">
        <div className="container-design">
          <header className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider border border-primary/20">
              <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
              {t("home_plans_label", lang)}
            </span>
            <h2 id="plans-heading" className="headline-section text-foreground">
              {t("home_plans_title", lang)}
            </h2>
            <p className="body-text text-muted-foreground">
              {t("home_plans_subtitle", lang)}
            </p>
          </header>

          <div className="card-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pro Plan */}
            <article className="relative p-6 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {t("home_plan_pro_tag", lang)}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">{t("home_plan_pro_name", lang)}</h3>
                <div className="space-y-1">
                  <span className="text-4xl font-bold text-primary font-heading tabular-nums">{t("home_plan_pro_price", lang)}</span>
                  <span className="text-sm text-muted-foreground">{t("home_plan_pro_period", lang)}</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {t("home_plan_pro_features", lang).split("|").map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full btn-secondary mt-4" onClick={() => setActiveTab("wallet")}>
                  {t("home_plan_cta", lang)}
                </button>
              </div>
            </article>

            {/* Max Plan */}
            <article className="relative p-6 rounded-[28px] bg-primary text-primary-foreground border border-primary hover:shadow-card-hover transition-all duration-500 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-[10px] font-bold uppercase tracking-wider border border-primary-foreground/30">
                {t("home_plan_max_tag", lang)}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{t("home_plan_max_name", lang)}</h3>
                <div className="space-y-1">
                  <span className="text-4xl font-bold font-heading tabular-nums">{t("home_plan_max_price", lang)}</span>
                  <span className="text-sm opacity-80">{t("home_plan_max_period", lang)}</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {t("home_plan_max_features", lang).split("|").map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm opacity-90">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold text-sm py-3 px-4 rounded-lg transition-colors mt-4" onClick={() => setActiveTab("wallet")}>
                  {t("home_plan_cta", lang)}
                </button>
              </div>
            </article>

            {/* Pro Max Plan */}
            <article className="relative p-6 rounded-[28px] bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-500 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                {t("home_plan_promax_tag", lang)}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">{t("home_plan_promax_name", lang)}</h3>
                <div className="space-y-1">
                  <span className="text-4xl font-bold text-amber-600 font-heading tabular-nums">{t("home_plan_promax_price", lang)}</span>
                  <span className="text-sm text-muted-foreground">{t("home_plan_promax_period", lang)}</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {t("home_plan_promax_features", lang).split("|").map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full btn-secondary mt-4 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white" onClick={() => setActiveTab("wallet")}>
                  {t("home_plan_cta", lang)}
                </button>
              </div>
            </article>

            {/* Ultra Plan */}
            <article className="relative p-6 rounded-[28px] bg-[linear-gradient(135deg,#1E2016_0%,#2E7D32_100%)] text-white border border-transparent hover:shadow-card-hover transition-all duration-500 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40">
                {t("home_plan_ultra_tag", lang)}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{t("home_plan_ultra_name", lang)}</h3>
                <div className="space-y-1">
                  <span className="text-4xl font-bold font-heading tabular-nums">{t("home_plan_ultra_price", lang)}</span>
                  <span className="text-sm opacity-70">{t("home_plan_ultra_period", lang)}</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {t("home_plan_ultra_features", lang).split("|").map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm opacity-90">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm py-3 px-4 rounded-lg transition-colors mt-4" onClick={() => setActiveTab("wallet")}>
                  {t("home_plan_cta", lang)}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Final CTA Band — rounded */}
      <section className="section bg-primary relative overflow-hidden rounded-[40px] mx-4 md:mx-0" aria-labelledby="cta-heading">
        <div className="container-design relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 py-12 px-6">
            <h2 id="cta-heading" className="headline-section text-primary-foreground">
              {t("home_cta_title", lang)}
            </h2>
            <p className="body-text text-primary-foreground/80">
              {t("home_cta_subtitle", lang)}
            </p>
            <button
              onClick={() => setActiveTab("menu")}
              className="btn-secondary bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              {t("home_cta_button", lang)}
              <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
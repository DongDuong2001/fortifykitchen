"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlask,
  faTruckFast,
  faFire,
  faShieldHalved,
  faQuoteLeft,
  faStar,
  faDumbbell,
  faUtensils,
  faArrowRight,
  faSeedling,
  faThermometerHalf,
  faWeightScale,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { MenuItem } from "@fortifykitchen/types";
import { getMenuItemLabel, formatVND } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface HomeSectionProps {
  lang: "vi" | "en";
  menuItems: MenuItem[];
  setActiveTab: (tab: string) => void;
  addToCart: (item: MenuItem, qty: number, flavorOverride?: string, lang?: "vi" | "en") => void;
}

const trustItems = [
  { icon: faTruckFast, key: "home_trust_delivery", color: "bg-primary/10 text-primary" },
  { icon: faWeightScale, key: "home_trust_macro", color: "bg-emerald-500/10 text-emerald-600" },
  { icon: faThermometerHalf, key: "home_trust_sousvide", color: "bg-amber-500/10 text-amber-600" },
  { icon: faSeedling, key: "home_trust_fresh", color: "bg-green-500/10 text-green-600" },
] as const;

const pillars = [
  {
    icon: faFlask,
    titleKey: "home_pillar_nutrition",
    descKey: "home_pillar_nutrition_desc",
    accent: "bg-primary/10 text-primary",
    iconColor: "text-primary",
  },
  {
    icon: faFire,
    titleKey: "home_pillar_quality",
    descKey: "home_pillar_quality_desc",
    accent: "bg-amber-500/10 text-amber-600",
    iconColor: "text-amber-600",
  },
  {
    icon: faUtensils,
    titleKey: "home_pillar_convenience",
    descKey: "home_pillar_convenience_desc",
    accent: "bg-emerald-500/10 text-emerald-600",
    iconColor: "text-emerald-600",
  },
  {
    icon: faDumbbell,
    titleKey: "home_pillar_flexibility",
    descKey: "home_pillar_flexibility_desc",
    accent: "bg-rose-500/10 text-rose-600",
    iconColor: "text-rose-600",
  },
] as const;

const processSteps = [
  { icon: faSeedling, titleKey: "home_process_step1_title", descKey: "home_process_step1_desc", number: "01" },
  { icon: faThermometerHalf, titleKey: "home_process_step2_title", descKey: "home_process_step2_desc", number: "02" },
  { icon: faShieldHalved, titleKey: "home_process_step3_title", descKey: "home_process_step3_desc", number: "03" },
  { icon: faTruckFast, titleKey: "home_process_step4_title", descKey: "home_process_step4_desc", number: "04" },
] as const;

const testimonials = [
  { textKey: "home_testimonial1", authorKey: "home_testimonial1_author", avatar: "MA" },
  { textKey: "home_testimonial2", authorKey: "home_testimonial2_author", avatar: "TK" },
] as const;

export default function HomeSection({ lang, menuItems, setActiveTab, addToCart }: HomeSectionProps) {
  const featuredItems = menuItems.slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background rounded-3xl border border-primary/10 p-8 sm:p-12 lg:p-16">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
            <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
            {t("home_hero_cta_order", lang)}
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading text-foreground leading-[1.1]">
            {t("home_hero_title", lang)}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("home_hero_subtitle", lang)}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab("menu")}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-4 px-8 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {t("home_hero_cta_menu", lang)}
              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab("order-now")}
              className="w-full sm:w-auto bg-card hover:bg-muted/50 text-foreground font-bold text-sm py-4 px-8 rounded-full tracking-widest uppercase border border-border transition-all duration-300 flex items-center justify-center gap-2"
            >
              {t("home_hero_cta_order", lang)}
            </button>
          </div>

          {/* Trust Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-border/50" role="list" aria-label="Trust indicators">
            {trustItems.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 text-center" role="listitem">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.color} transition-colors hover:scale-105`}>
                  <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground leading-snug">{t(item.key, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[5%] right-[5%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-10" aria-labelledby="featured-heading">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
            <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
            {t("home_featured_title", lang)}
          </span>
          <h2 id="featured-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
            {t("home_featured_title", lang)}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("home_featured_subtitle", lang)}</p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredItems.map((item) => (
            <article
              key={item.id}
              className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                <img
                  src={item.imageUrl}
                  alt={getMenuItemLabel(item)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-4 right-4 bg-primary/90 text-primary-foreground font-mono text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                  {t(`filter_${item.protein}` as keyof Dictionary, lang)}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-bold font-heading text-foreground line-clamp-1">{getMenuItemLabel(item)}</h3>
                    <span className="text-sm font-bold text-primary shrink-0">{formatVND(item.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDumbbell} className="h-3.5 w-3.5" />
                  <span className="font-medium">~35g Protein</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFire} className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">~250 kcal</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUtensils} className="h-3.5 w-3.5" />
                  <span className="font-medium">{item.sizeGrams}g</span>
                </span>
              </div>

                <button
                  onClick={() => addToCart(item, 1, undefined, lang)}
                  className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-primary/50"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  {t("btn_add_cart", lang)}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => setActiveTab("menu")}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {t("filter_all", lang)}
            <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Why Fortify - Value Pillars */}
      <section className="bg-muted/20 border border-border/30 rounded-3xl p-8 sm:p-12 space-y-12" aria-labelledby="pillars-heading">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
            <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3" />
            {t("filter_all", lang)}
          </span>
          <h2 id="pillars-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
            {t("menu_title", lang)}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("menu_subtitle", lang)}</p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <article
              key={i}
              className="group bg-card border border-border/50 rounded-2xl p-6 space-y-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${pillar.accent} ${pillar.iconColor} transition-all duration-300 group-hover:scale-110`}>
                <FontAwesomeIcon icon={pillar.icon} className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{t(pillar.titleKey, lang)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(pillar.descKey, lang)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works - Process */}
      <section className="space-y-12" aria-labelledby="process-heading">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
            <FontAwesomeIcon icon={faFlask} className="h-3 w-3" />
            {t("home_process_title", lang)}
          </span>
          <h2 id="process-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
            {t("home_process_title", lang)}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("home_process_subtitle", lang)}</p>
        </header>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {processSteps.map((step, i) => (
              <article
                key={i}
                className="relative text-center space-y-5"
              >
                <div className="relative z-10 mx-auto">
                  <div className="h-20 w-20 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg mx-auto">
                    <span className="text-[10px] font-bold text-primary/50 uppercase tracking-wider mb-2">{step.number}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <FontAwesomeIcon icon={step.icon} className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">{t(step.titleKey, lang)}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(step.descKey, lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="bg-[#D4EFE4]/30 border border-[#D4EFE4]/70 rounded-3xl p-8 sm:p-12 space-y-10 max-w-5xl mx-auto" aria-labelledby="testimonial-heading">
        <header className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
            <FontAwesomeIcon icon={faQuoteLeft} className="h-3 w-3" />
            {t("home_testimonial_title", lang)}
          </span>
          <h2 id="testimonial-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-[#2F4A3C]">
            {t("home_testimonial_title", lang)}
          </h2>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <article
              key={i}
              className="bg-white/70 backdrop-blur-sm border border-[#D4EFE4]/50 rounded-2xl p-8 space-y-6 text-left hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faQuoteLeft} className="h-5 w-5 text-emerald-500/50" />
              </div>
              <p className="text-base sm:text-lg font-light italic leading-relaxed text-[#2F4A3C] font-heading">
                {t(testimonial.textKey, lang)}
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-[#D4EFE4]/50">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2F4A3C]">{t(testimonial.authorKey, lang)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-3xl p-8 sm:p-12 lg:p-16 text-center space-y-8 text-primary-foreground">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading">
            {t("home_cta_title", lang)}
          </h2>
          <p className="text-sm sm:text-base opacity-90 max-w-lg mx-auto leading-relaxed">
            {t("home_cta_subtitle", lang)}
          </p>
          <button
            onClick={() => setActiveTab("menu")}
            className="inline-flex items-center gap-2 bg-primary-foreground hover:bg-primary-foreground/90 text-primary font-bold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {t("home_cta_button", lang)}
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
}
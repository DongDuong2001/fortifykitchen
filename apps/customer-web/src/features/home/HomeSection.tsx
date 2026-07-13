"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask, faLeaf, faHeart, faQuoteLeft, faShieldHalved, faPlus, faTruck as faTruckIcon } from "@fortawesome/free-solid-svg-icons";
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

export default function HomeSection({ lang, menuItems, setActiveTab, addToCart }: HomeSectionProps) {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Trust Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {[
          { icon: faFlask, text: t("nav_sub", lang) },
          { icon: faLeaf, text: t("nav_order", lang) },
          { icon: faHeart, text: t("nav_wallet", lang) },
          { icon: faTruckIcon, text: t("nav_calculator", lang) },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-left">
            <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
              <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-foreground leading-snug">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Featured Menu Section */}
      <div className="space-y-10 text-center">
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">
            {t("filter_all", lang)}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">{t("menu_title", lang)}</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">{t("menu_subtitle", lang)}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.slice(0, 3).map((item) => (
            <div key={item.id} className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20 border-b border-border/40 relative">
                  <img src={item.imageUrl} alt={getMenuItemLabel(item)} className="w-full h-full object-cover" />
                  <span className="absolute top-4 right-4 bg-primary text-primary-foreground font-mono text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                    {t(`filter_${item.protein}` as keyof Dictionary, lang)}
                  </span>
                </div>
                <div className="p-6 text-left space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-bold font-heading">{getMenuItemLabel(item)}</h3>
                    <span className="text-sm font-bold text-primary">{formatVND(item.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => addToCart(item, 1, undefined, lang)}
                  className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                  {t("btn_add_cart", lang)}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <button
            onClick={() => setActiveTab("menu")}
            className="bg-primary hover:bg-[#95260f] text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md"
          >
            {t("filter_all", lang)}
          </button>
        </div>
      </div>

      {/* Why Fortify — Canonical Pillars */}
      <div className="bg-muted/10 border border-border/20 rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">
            {t("filter_all", lang)}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">{t("menu_title", lang)}</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">{t("menu_subtitle", lang)}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FontAwesomeIcon icon={faFlask} className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{t("filter_BEEF", lang)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_CHICKEN", lang)}</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <FontAwesomeIcon icon={faLeaf} className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{t("filter_SHRIMP", lang)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_PORK", lang)}</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
            <div className="h-10 w-10 rounded-xl bg-rose-500/5 flex items-center justify-center text-rose-500 transition-colors group-hover:bg-rose-500 group-hover:text-white">
              <FontAwesomeIcon icon={faHeart} className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{t("filter_FISH", lang)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_VEGAN", lang)}</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
            <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{t("filter_all", lang)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_all", lang)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sous-vide Story */}
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">{t("filter_all", lang)}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">{t("menu_title", lang)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("menu_subtitle", lang)}</p>
        </div>

        <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-muted/20 border border-border/40 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800"
            alt={t("menu_subtitle", lang)}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Mission / Quote Callout */}
      <div className="border border-border/70 bg-card rounded-3xl p-8 sm:p-10 shadow-warm relative overflow-hidden flex gap-5 sm:gap-6 items-start max-w-4xl mx-auto">
        <FontAwesomeIcon icon={faQuoteLeft} className="h-8 w-8 text-primary/20 shrink-0 mt-1" />
        <div className="space-y-4">
          <p className="text-base sm:text-lg text-foreground font-heading italic leading-relaxed">{t("menu_subtitle", lang)}</p>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-secondary/40" />
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest font-sans">{t("filter_all", lang)}</span>
          </div>
        </div>
      </div>

      {/* Customer Testimonial */}
      <div className="bg-[#D4EFE4]/30 border border-[#D4EFE4]/70 p-12 rounded-3xl space-y-8 text-center max-w-4xl mx-auto">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#2F4A3C]">{t("filter_all", lang)}</span>
        <p className="text-xl sm:text-2xl font-light italic leading-relaxed text-[#2F4A3C] font-heading">{t("menu_subtitle", lang)}</p>
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#2F4A3C]">Minh Anh</p>
          <p className="text-[10px] text-[#2F4A3C]/70">{t("filter_all", lang)}</p>
        </div>
      </div>

      {/* Final CTA Band */}
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-10 sm:p-14 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">{t("menu_title", lang)}</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">{t("menu_subtitle", lang)}</p>
        <button
          onClick={() => setActiveTab("menu")}
          className="bg-primary hover:bg-[#95260f] text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md active:scale-98"
        >
          {t("btn_add_cart", lang)}
        </button>
      </div>
    </div>
  );
}
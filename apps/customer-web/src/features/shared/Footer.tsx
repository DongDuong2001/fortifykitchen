"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faMapMarkerAlt, faPhone, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface FooterProps {
  lang: "vi" | "en";
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="bg-muted/30 border-t border-border/50 py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2"><img src="/logo.png" alt="Fortify Kitchen" className="h-8 w-8 rounded-md object-contain" /><span className="font-semibold tracking-tight font-heading text-sm">Fortify<span className="font-sans font-light tracking-wide text-primary ml-0.5">Kitchen</span></span></div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("order_subtitle", lang)}</p>
            <div className="flex gap-4"><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} className="h-4 w-4" /></a><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} className="h-4 w-4" /></a></div>
          </div>
          <div className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("nav_sub", lang)}</h4><ul className="space-y-2 text-xs text-muted-foreground"><li><a href="#" className="hover:text-primary transition-colors">{t("nav_menu", lang)}</a></li><li><a href="#" className="hover:text-primary transition-colors">{t("nav_order", lang)}</a></li><li><a href="#" className="hover:text-primary transition-colors">{t("nav_calculator", lang)}</a></li><li><a href="#" className="hover:text-primary transition-colors">{t("nav_wallet", lang)}</a></li><li><a href="#" className="hover:text-primary transition-colors">{t("nav_sub", lang)}</a></li></ul></div>
          <div className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("filter_all", lang)}</h4><ul className="space-y-2 text-xs text-muted-foreground"><li className="flex items-center gap-2"><FontAwesomeIcon icon={faMapMarkerAlt} className="h-3.5 w-3.5 shrink-0" /> {t("filter_all", lang)}</li><li className="flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5 shrink-0" /> 090 123 4567</li><li className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5 shrink-0" /> hello@fortifykitchen.com</li></ul></div>
          <div className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("filter_all", lang)}</h4><ul className="space-y-2 text-xs text-muted-foreground"><li>{t("filter_all", lang)}: 07:00 - 21:00</li><li>{t("filter_all", lang)}: 08:00 - 20:00</li></ul></div>
        </div>
        <div className="pt-8 border-t border-border/50"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><p className="text-xs text-muted-foreground text-center md:text-left">{t("filter_all", lang)}</p><div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground"><a href="#" className="hover:text-primary transition-colors">{t("filter_all", lang)}</a><a href="#" className="hover:text-primary transition-colors">{t("filter_all", lang)}</a><a href="#" className="hover:text-primary transition-colors">{t("filter_all", lang)}</a></div></div></div>
      </div>
    </footer>
  );
}
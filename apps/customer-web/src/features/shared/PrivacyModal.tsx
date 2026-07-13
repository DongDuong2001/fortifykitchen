"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface PrivacyModalProps {
  lang: "vi" | "en";
  showPrivacyModal: boolean;
  setShowPrivacyModal: (show: boolean) => void;
}

export default function PrivacyModal({ lang, showPrivacyModal, setShowPrivacyModal }: PrivacyModalProps) {
  if (!showPrivacyModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(false)} />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold font-heading">{t("filter_all", lang)}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("filter_all", lang)}</p>
          </div>
          <button onClick={() => setShowPrivacyModal(false)} className="text-muted-foreground hover:text-foreground p-1"><FontAwesomeIcon icon={faTimes} className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
          <section className="space-y-3"><h4 className="font-bold text-foreground">{t("filter_all", lang)}</h4><p>{t("filter_all", lang)}</p></section>
        </div>
      </div>
    </div>
  );
}
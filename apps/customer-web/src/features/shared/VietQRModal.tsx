"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faQrcode, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface VietQRModalProps {
  lang: "vi" | "en";
  checkoutResult: any;
  setCheckoutResult: (result: any) => void;
  setCartOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  clearCart: () => void;
  setDiscountCode: (code: string) => void;
}

export default function VietQRModal({ lang, checkoutResult, setCheckoutResult, setCartOpen, setActiveTab, clearCart, setDiscountCode }: VietQRModalProps) {
  if (!checkoutResult) return null;

  const total = checkoutResult.total || 0;
  const orderId = checkoutResult.id || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={() => { setCheckoutResult(null); setDiscountCode(""); clearCart(); setCartOpen(false); setActiveTab("dashboard"); }} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-5 text-center">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold font-heading">{t("filter_all", lang)}</h3>
          <button onClick={() => { setCheckoutResult(null); setDiscountCode(""); clearCart(); setCartOpen(false); setActiveTab("dashboard"); }} className="text-muted-foreground hover:text-foreground p-1"><FontAwesomeIcon icon={faTimes} className="h-5 w-5" /></button>
        </div>

        <FontAwesomeIcon icon={faQrcode} className="h-10 w-10 mx-auto text-primary" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_all", lang)}</p>

        <div className="bg-white p-2.5 rounded-lg border border-border w-56 h-56 mx-auto flex items-center justify-center">
          <img src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${total}&addInfo=FK${orderId.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`} alt="VietQR Payment Code" className="w-full h-full object-contain" />
        </div>

        <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-2 text-left text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold">MB Bank</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold font-mono">19035678901234</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold">FORTIFY KITCHEN</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-bold text-primary">{total.toLocaleString()} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-mono text-muted-foreground">FK{orderId.slice(0, 8)}</span></div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed"><p className="font-semibold mb-1 flex items-center gap-1"><FontAwesomeIcon icon={faInfoCircle} className="h-3.5 w-3.5" />{t("filter_all", lang)}</p><p>{t("filter_all", lang)}</p></div>

        <button onClick={() => { setCheckoutResult(null); setDiscountCode(""); clearCart(); setCartOpen(false); setActiveTab("dashboard"); }} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all">{t("btn_done", lang)}</button>
      </div>
    </div>
  );
}
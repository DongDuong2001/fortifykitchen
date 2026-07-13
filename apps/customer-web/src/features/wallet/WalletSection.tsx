"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faGift, faTag, faPlus, faCreditCard, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { getPlanBenefits } from "@/lib/utils";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface WalletSectionProps {
  lang: "vi" | "en";
  user: any;
  walletBalance: number;
  planDiscountPercent: number;
  planDiscountEndsAt: string | null;
  subscriptionPlans: any[];
  isLoadingPlans: boolean;
  purchasingPlanId: string | null;
  planPurchaseResult: any;
  setPlanPurchaseResult: (result: any) => void;
  handleBuyPlan: (plan: any) => Promise<void>;
}

export default function WalletSection({
  lang,
  user,
  walletBalance,
  planDiscountPercent,
  planDiscountEndsAt,
  subscriptionPlans,
  isLoadingPlans,
  purchasingPlanId,
  planPurchaseResult,
  setPlanPurchaseResult,
  handleBuyPlan,
}: WalletSectionProps) {
  const hasActivePlanDiscount = planDiscountPercent > 0 && !!planDiscountEndsAt && new Date(planDiscountEndsAt) > new Date();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <FontAwesomeIcon icon={faWallet} className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">{t("dash_title", lang)}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {t("dash_subtitle", lang)}
          </p>
          <button onClick={() => {}} className="bg-primary text-primary-foreground text-xs font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all cursor-pointer">{t("btn_signin", lang)}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 text-primary"><FontAwesomeIcon icon={faWallet} className="h-5 w-5" /></div>
            <h3 className="text-sm font-bold font-heading">{t("dash_balance", lang)}</h3>
          </div>
          {hasActivePlanDiscount && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">{t("filter_all", lang)}</span>}
        </div>
        <div className="text-4xl font-bold font-heading text-foreground mb-2">{walletBalance.toLocaleString()} ₫</div>
        <p className="text-xs text-muted-foreground">{t("filter_all", lang)}</p>
      </div>

      {hasActivePlanDiscount && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faTag} className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-emerald-800">{t("filter_all", lang)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-emerald-700 font-semibold">{planDiscountPercent}%</p><p className="text-xs text-emerald-600">{t("filter_all", lang)}</p></div>
            <div><p className="text-emerald-700 font-semibold">{new Date(planDiscountEndsAt!).toLocaleDateString("vi-VN")}</p><p className="text-xs text-emerald-600">{t("filter_all", lang)}</p></div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-bold font-heading">{t("sub_title", lang)}</h3>{isLoadingPlans && <FontAwesomeIcon icon={faWallet} className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
        {subscriptionPlans.length === 0 && !isLoadingPlans ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl"><FontAwesomeIcon icon={faGift} className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground font-medium">{t("filter_all", lang)}</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className={`border border-border bg-card rounded-2xl p-4 shadow-sm transition-all ${plan.isActive ? "" : "opacity-50"}`}>
                <div className="mb-3"><h4 className="font-bold font-heading">{plan.name}</h4><p className="text-xs text-muted-foreground">{plan.description || t("filter_all", lang)}</p></div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-bold text-primary">{plan.price.toLocaleString()} ₫</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-bold text-emerald-600">{plan.voucherPercent}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold">{(plan.price * plan.voucherPercent / 100).toLocaleString()} ₫ {t("filter_all", lang)}</span></div>
                </div>
                <div className="space-y-1.5 mb-4 text-xs text-emerald-700">
                  {getPlanBenefits(plan.voucherPercent, lang).map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5"><FontAwesomeIcon icon={b.icon} className="h-3.5 w-3.5 shrink-0" /><span>{b.text}</span></div>
                  ))}
                </div>
                <button onClick={() => handleBuyPlan(plan)} disabled={purchasingPlanId === plan.id || !plan.isActive} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">{purchasingPlanId === plan.id ? <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 animate-spin" /> : <><FontAwesomeIcon icon={faPlus} className="h-4 w-4" />{plan.isActive ? t("filter_all", lang) : t("filter_all", lang)}</>}</button>
              </div>
            ))}
          </div>
        )}
        {planPurchaseResult && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setPlanPurchaseResult(null)} />
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
              <FontAwesomeIcon icon={faCreditCard} className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-sm font-bold font-heading">{t("filter_all", lang)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("filter_all", lang)}</p>
              <div className="bg-white p-2.5 rounded-lg border border-border w-48 h-48 mx-auto flex items-center justify-center"><img src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${planPurchaseResult.amount}&addInfo=${planPurchaseResult.memo}&accountName=FORTIFY%20KITCHEN`} alt="VietQR Payment Code" className="w-full h-full object-contain" /></div>
              <div className="border border-border bg-muted/20 rounded-xl p-3 space-y-1 text-xs text-left"><div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold">MB Bank</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold font-mono">19035678901234</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-semibold">FORTIFY KITCHEN</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-bold text-primary">{planPurchaseResult.amount.toLocaleString()} ₫</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t("filter_all", lang)}</span><span className="font-mono text-muted-foreground">{planPurchaseResult.memo}</span></div></div>
              <button onClick={() => setPlanPurchaseResult(null)} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all">{t("btn_done", lang)}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
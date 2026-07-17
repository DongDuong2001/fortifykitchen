"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faQrcode, faInfoCircle, faCheckCircle, faWallet, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
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
  const paymentMethod = checkoutResult.paymentMethod || "BANK_TRANSFER";

  const isCOD = paymentMethod === "CASH_ON_DELIVERY";
  const isWallet = paymentMethod === "WALLET";

  const handleClose = () => {
    setCheckoutResult(null);
    setDiscountCode("");
    clearCart();
    setCartOpen(false);
    setActiveTab("dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-5 text-center">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold font-heading">
            {isCOD || isWallet ? t("success_title", lang) : t("cart_vietqr", lang)}
          </h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1">
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        {isCOD ? (
          <>
            <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-foreground mt-2">{t("success_title", lang)}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              {t("success_cod_desc", lang)}
            </p>

            <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("order_id", lang)}</span>
                <span className="font-semibold font-mono">FK{orderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart_payment", lang)}</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-500" />
                  {t("payment_cod", lang)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart_total", lang)}</span>
                <span className="font-bold text-primary">{total.toLocaleString()} ₫</span>
              </div>
            </div>
          </>
        ) : isWallet ? (
          <>
            <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-foreground mt-2">{t("success_title", lang)}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              {t("order_paid_wallet", lang)}
            </p>

            <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("order_id", lang)}</span>
                <span className="font-semibold font-mono">FK{orderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart_payment", lang)}</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faWallet} className="text-primary" />
                  {lang === "vi" ? "Ví thành viên" : "Member Wallet"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart_total", lang)}</span>
                <span className="font-bold text-primary">{total.toLocaleString()} ₫</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faQrcode} className="h-10 w-10 mx-auto text-primary" />
            <p className="text-xs text-muted-foreground leading-relaxed">{t("success_vietqr_desc", lang)}</p>

            <div className="bg-white p-2.5 rounded-lg border border-border w-56 h-56 mx-auto flex items-center justify-center">
              <img src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${total}&addInfo=FK${orderId.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`} alt="VietQR Payment Code" className="w-full h-full object-contain" />
            </div>

            <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-2 text-left text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("bank_name", lang)}</span><span className="font-semibold">MB Bank</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("bank_acc", lang)}</span><span className="font-semibold font-mono">19035678901234</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("bank_holder", lang)}</span><span className="font-semibold">FORTIFY KITCHEN</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("bank_amount", lang)}</span><span className="font-bold text-primary">{total.toLocaleString()} ₫</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("bank_memo", lang)}</span><span className="font-mono text-muted-foreground font-semibold">FK{orderId.slice(0, 8)}</span></div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faInfoCircle} className="h-3.5 w-3.5" />
                {lang === "vi" ? "Lưu ý chuyển khoản" : "Transfer Note"}
              </p>
              <p>{t("transfer_confirmed", lang)}</p>
            </div>
          </>
        )}

        <button onClick={handleClose} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer">
          {t("btn_done", lang)}
        </button>
      </div>
    </div>
  );
}
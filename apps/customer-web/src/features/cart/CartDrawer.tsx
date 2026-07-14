"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faPlus, faMinus, faTrashAlt, faCheckCircle, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { MenuItem } from "@fortifykitchen/types";
import { getMenuItemLabel, calculateOrderTotal } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

function CartItem({ item, lang, onUpdateQty, onRemove }: { item: { menuItem: MenuItem; quantity: number }; lang: "vi" | "en"; onUpdateQty: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  const { menuItem, quantity } = item;
  const maxQty = menuItem.stockQuantity ?? 99;

  return (
    <div className="flex gap-3 pb-4 border-b border-border/40 last:border-0 last:pb-0">
      <div className="h-16 w-16 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden relative">
        {menuItem.imageUrl ? (<img src={menuItem.imageUrl} alt={getMenuItemLabel(menuItem)} className="w-full h-full object-cover" />) : (<FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-muted-foreground/30 mx-auto my-auto" />)}
        {(menuItem.stockQuantity ?? 0) <= 0 && (<span className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white">{t("filter_all", lang)}</span>)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold truncate">{getMenuItemLabel(menuItem)}</h4>
          <p className="text-xs text-muted-foreground">{formatVND(menuItem.price)} × {quantity}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1">
            <button onClick={() => onUpdateQty(menuItem.id, quantity - 1)} disabled={quantity <= 1} className="h-6 w-6 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30"><FontAwesomeIcon icon={faMinus} className="h-3 w-3" /></button>
            <span className="text-sm font-bold w-8 text-center">{quantity}</span>
            <button onClick={() => onUpdateQty(menuItem.id, quantity + 1)} disabled={quantity >= maxQty} className="h-6 w-6 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30"><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /></button>
          </div>
          <button onClick={() => onRemove(menuItem.id)} className="text-red-500 hover:text-red-600 p-1" aria-label="Remove"><FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function formatVND(num: number): string {
  return `${num.toLocaleString()} ₫`;
}

interface CartDrawerProps {
  lang: "vi" | "en";
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cart: { menuItem: MenuItem; quantity: number }[];
  cartCount: number;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  checkoutStep: "cart" | "details";
  setCheckoutStep: (step: "cart" | "details") => void;
  hasActivePlanDiscount: boolean;
  planDiscountPercent: number;
  verifiedDiscount: { type: string; amount: number } | null;
  checkoutNotes: string;
  setCheckoutNotes: (notes: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  checkoutAgreeTerms: boolean;
  setCheckoutAgreeTerms: (agree: boolean) => void;
  isSubmittingOrder: boolean;
  checkoutError: string | null;
  handleCheckout: (e: React.FormEvent) => Promise<void>;
  checkoutProvince: string;
  setCheckoutProvince: (province: string) => void;
  checkoutStreet: string;
  setCheckoutStreet: (street: string) => void;
}

export default function CartDrawer({
  lang,
  isCartOpen,
  setCartOpen,
  cart,
  cartCount,
  removeFromCart,
  updateCartQuantity,
  checkoutStep,
  setCheckoutStep,
  hasActivePlanDiscount,
  planDiscountPercent,
  verifiedDiscount,
  checkoutNotes,
  setCheckoutNotes,
  paymentMethod,
  setPaymentMethod,
  checkoutAgreeTerms,
  setCheckoutAgreeTerms,
  isSubmittingOrder,
  checkoutError,
  handleCheckout,
  checkoutProvince,
  setCheckoutProvince,
  checkoutStreet,
  setCheckoutStreet,
}: CartDrawerProps) {
  if (!isCartOpen) return null;

  const cartPricing = calculateOrderTotal(cart.map((i) => ({ menuItemId: i.menuItem.id, protein: i.menuItem.protein as any, flavor: i.menuItem.flavor, sizeGrams: i.menuItem.sizeGrams, unitPrice: i.menuItem.price, qty: i.quantity })));

  // Raw total (no discounts)
  const rawTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  // Protein discount (per-protein >=1000g = 10% off)
  const proteinDiscountAmount = rawTotal - cartPricing.lineSubtotal;

  // Order tier discount
  const orderDiscountAmount = cartPricing.orderDiscountAmount || (cartPricing.lineSubtotal - cartPricing.finalTotal);
  
  // Member plan discount (applied on lineSubtotal)
  const planDiscountAmount = hasActivePlanDiscount ? (cartPricing.lineSubtotal * planDiscountPercent) / 100 : 0;
  
  // Coupon discount
  const couponDiscountAmount = verifiedDiscount 
    ? Math.max(
        verifiedDiscount.type === "PERCENTAGE" 
          ? (cartPricing.lineSubtotal * verifiedDiscount.amount) / 100 
          : verifiedDiscount.amount, 
        0
      )
    : 0;

  // Combined discount total (capped at lineSubtotal)
  const combinedDiscountAmount = Math.min(planDiscountAmount + couponDiscountAmount, cartPricing.lineSubtotal);
  
  // Final total after all discounts
  const checkoutFinalTotal = Math.max(cartPricing.lineSubtotal - combinedDiscountAmount - orderDiscountAmount, 0);

  if (checkoutStep === "details") {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} />
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-card shadow-2xl flex flex-col md:relative md:shadow-none md:bg-transparent">
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
            <h3 className="font-semibold font-heading">{t("cart_title", lang)}</h3>
            <button onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} className="text-muted-foreground hover:text-foreground p-1">
              <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCheckout} className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_address", lang)}</label>
              <div className="space-y-2">
                <select value={checkoutProvince} onChange={(e) => setCheckoutProvince(e.target.value)} className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none cursor-pointer font-bold font-mono">
                  <option value="">{t("cart_province", lang)}</option>
                  <option value="79">TP. Hồ Chí Minh</option>
                </select>
                <input type="text" placeholder={t("cart_street", lang)} value={checkoutStreet} onChange={(e) => setCheckoutStreet(e.target.value)} className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_notes", lang)}</label>
              <textarea value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} rows={2} className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none" placeholder={t("placeholder_notes", lang)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_payment", lang)}</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaymentMethod("CASH_ON_DELIVERY")} className={`flex-1 py-2.5 border rounded-lg text-xs font-bold transition-all ${paymentMethod === "CASH_ON_DELIVERY" ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border hover:bg-muted"}`}>{t("cart_cod", lang)}</button>
                <button type="button" onClick={() => setPaymentMethod("BANK_TRANSFER")} className={`flex-1 py-2.5 border rounded-lg text-xs font-bold transition-all ${paymentMethod === "BANK_TRANSFER" ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border hover:bg-muted"}`}>{t("cart_vietqr", lang)}</button>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="checkoutAgreeTerms" checked={checkoutAgreeTerms} onChange={(e) => setCheckoutAgreeTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" required />
              <label htmlFor="checkoutAgreeTerms" className="text-xs text-muted-foreground cursor-pointer">{t("cart_agree", lang)} <a href="#" className="text-primary hover:underline">{t("cart_terms", lang)}</a></label>
            </div>
            {checkoutError && <p className="text-xs text-red-500 text-center">{checkoutError}</p>}
            <div className="border border-border bg-muted/25 rounded-xl p-4 space-y-3 text-left">
              <p className="text-xs font-bold text-foreground text-center">{lang === "vi" ? "Tóm tắt đơn hàng" : "Order Summary"}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("cart_subtotal", lang)}</span><span className="font-semibold">{formatVND(rawTotal)}</span></div>
                {proteinDiscountAmount > 0 && (<div className="flex justify-between text-emerald-600"><span>{lang === "vi" ? "Giảm protein (≥1kg/loại)" : "Protein discount (≥1kg/type)"}</span><span>-{formatVND(proteinDiscountAmount)}</span></div>)}
                {orderDiscountAmount > 0 && (<div className="flex justify-between text-emerald-600"><span>{lang === "vi" ? `Giảm đơn hàng (${cartPricing.orderDiscountPercent || 0}%)` : `Order discount (${cartPricing.orderDiscountPercent || 0}%)`}</span><span>-{formatVND(orderDiscountAmount)}</span></div>)}
                {hasActivePlanDiscount && (<div className="flex justify-between text-emerald-600"><span>{lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}</span><span>-{formatVND(planDiscountAmount)}</span></div>)}
                {couponDiscountAmount > 0 && (<div className="flex justify-between text-emerald-600"><span>{t("cart_discount", lang)}</span><span>-{formatVND(couponDiscountAmount)}</span></div>)}
                {/* Shipping fee removed from the cart — it's calculated and collected separately, not part of this total. */}
                <div className="flex justify-between items-baseline text-base font-bold border-t border-border/50 pt-2.5">
                  <span>{t("cart_total", lang)}</span>
                  <span className="text-primary text-lg">{formatVND(checkoutFinalTotal)}</span>
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSubmittingOrder} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
              {isSubmittingOrder ? <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 animate-spin" /> : t("btn_checkout", lang)}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-card shadow-2xl flex flex-col md:relative md:shadow-none">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-semibold font-heading">{t("cart_title", lang)} ({cartCount})</h3>
          <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12"><FontAwesomeIcon icon={faShoppingBag} className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground font-medium">{t("cart_empty", lang)}</p></div>
          ) : (
            <>
              <div className="space-y-3">{cart.map((item) => (<CartItem key={item.menuItem.id} item={item} lang={lang} onUpdateQty={updateCartQuantity} onRemove={removeFromCart} />))}</div>
              <div className="border-t border-border/40 pt-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t("cart_subtotal", lang)}</span><span className="font-semibold">{formatVND(rawTotal)}</span></div>
                {proteinDiscountAmount > 0 && (<div className="flex justify-between text-xs text-emerald-600"><span>{lang === "vi" ? "Giảm protein (≥1kg/loại)" : "Protein discount (≥1kg/type)"}</span><span>-{formatVND(proteinDiscountAmount)}</span></div>)}
                {orderDiscountAmount > 0 && (<div className="flex justify-between text-xs text-emerald-600"><span>{lang === "vi" ? `Giảm đơn hàng (${cartPricing.orderDiscountPercent || 0}%)` : `Order discount (${cartPricing.orderDiscountPercent || 0}%)`}</span><span>-{formatVND(orderDiscountAmount)}</span></div>)}
                {hasActivePlanDiscount && (<div className="flex justify-between text-xs text-emerald-600"><span>{lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}</span><span>-{formatVND(planDiscountAmount)}</span></div>)}
                {couponDiscountAmount > 0 && (<div className="flex justify-between text-xs text-emerald-600"><span>{t("cart_discount", lang)}</span><span>-{formatVND(couponDiscountAmount)}</span></div>)}
                {/* Shipping fee removed from the cart — it's calculated and collected separately, not part of this total. */}
                <div className="flex justify-between items-baseline text-base font-bold border-t border-border/50 pt-2.5">
                  <span>{t("cart_total", lang)}</span>
                  <span className="text-primary text-lg">{formatVND(checkoutFinalTotal)}</span>
                </div>
                <button onClick={() => setCheckoutStep("details")} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10">{t("btn_checkout", lang)}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
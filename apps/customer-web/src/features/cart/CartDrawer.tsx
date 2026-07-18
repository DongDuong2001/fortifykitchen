"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faPlus, faMinus, faTrashAlt, faCheckCircle, faUtensils, faXmark } from "@fortawesome/free-solid-svg-icons";
import { MenuItem } from "@fortifykitchen/types";
import { getMenuItemLabel, calculateOrderTotal } from "@fortifykitchen/shared";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

function CartItem({ item, lang, onUpdateQty, onRemove }: { item: { menuItem: MenuItem; quantity: number }; lang: "vi" | "en"; onUpdateQty: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  const { menuItem, quantity } = item;
  const maxQty = menuItem.stockQuantity ?? 99;

  return (
    <div className="relative bg-card border border-border rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="h-16 w-16 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden relative">
          {menuItem.imageUrl ? (
            <img src={menuItem.imageUrl} alt={getMenuItemLabel(menuItem)} className="w-full h-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-muted-foreground/30 mx-auto my-auto" />
          )}
          {(menuItem.stockQuantity ?? 0) <= 0 && (
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white">
              {t("filter_all", lang)}
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate pr-8">{getMenuItemLabel(menuItem)}</h4>
          <p className="text-xs text-muted-foreground">{formatVND(menuItem.price)} × {quantity}</p>
        </div>

        {/* Quantity Controls + Remove */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
            <button
              onClick={() => onUpdateQty(menuItem.id, quantity - 1)}
              disabled={quantity <= 1}
              className="h-7 w-7 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faMinus} className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => onUpdateQty(menuItem.id, quantity + 1)}
              disabled={quantity >= maxQty}
              className="h-7 w-7 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => onRemove(menuItem.id)}
            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            aria-label="Remove"
          >
            <FontAwesomeIcon icon={faTrashAlt} className="h-4.5 w-4.5" />
          </button>
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
  isGuest: boolean;
  checkoutGuestName: string;
  setCheckoutGuestName: (name: string) => void;
  checkoutGuestPhone: string;
  setCheckoutGuestPhone: (phone: string) => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  discountCodeStatus: "idle" | "checking" | "valid" | "invalid";
  discountCodeError: string | null;
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
  isGuest,
  checkoutGuestName,
  setCheckoutGuestName,
  checkoutGuestPhone,
  setCheckoutGuestPhone,
  discountCode,
  setDiscountCode,
  discountCodeStatus,
  discountCodeError,
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
        {/* Mobile backdrop */}
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} />
        
        {/* Cart Drawer - Checkout Details */}
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-card shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
            <h3 className="font-semibold font-heading">{t("cart_title", lang)}</h3>
            <button 
              onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} 
              className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCheckout} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Guest Contact Info */}
            {isGuest && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 text-primary" />
                  {lang === "vi" ? "Thông tin liên hệ" : "Contact Info"}
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t("placeholder_name", lang)}
                    value={checkoutGuestName}
                    onChange={(e) => setCheckoutGuestName(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-xl outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t("placeholder_phone", lang)}
                    value={checkoutGuestPhone}
                    onChange={(e) => setCheckoutGuestPhone(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 text-primary" />
                {t("cart_address", lang)}
              </label>
              <div className="space-y-3">
                <select
                  value={checkoutProvince}
                  onChange={(e) => setCheckoutProvince(e.target.value)}
                  className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-xl outline-none cursor-pointer font-bold font-mono"
                >
                  <option value="">{t("cart_province", lang)}</option>
                  <option value="79">TP. Hồ Chí Minh</option>
                </select>
                <input
                  type="text"
                  placeholder={t("cart_street", lang)}
                  value={checkoutStreet}
                  onChange={(e) => setCheckoutStreet(e.target.value)}
                  className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            {/* Discount Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 text-primary" />
                {t("cart_coupon", lang)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("cart_coupon", lang)}
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 pr-10 rounded-xl outline-none uppercase"
                />
                {discountCodeStatus === "checking" && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⋯</span>
                )}
                {discountCodeStatus === "valid" && (
                  <FontAwesomeIcon icon={faCheckCircle} className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                )}
              </div>
              {discountCodeStatus === "valid" && verifiedDiscount && (
                <p className="text-xs text-emerald-600 font-semibold">
                  {t("cart_applied", lang)} — {verifiedDiscount.type === "PERCENTAGE" ? `${verifiedDiscount.amount}%` : formatVND(verifiedDiscount.amount)}
                </p>
              )}
              {discountCodeStatus === "invalid" && (
                <p className="text-xs text-red-500">{discountCodeError || t("cart_invalid_coupon", lang)}</p>
              )}
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 text-primary" />
                {t("cart_notes", lang)}
              </label>
              <textarea 
                value={checkoutNotes} 
                onChange={(e) => setCheckoutNotes(e.target.value)} 
                rows={3} 
                className="w-full bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-xl outline-none resize-none" 
                placeholder={t("placeholder_notes", lang)} 
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4 text-primary" />
                {t("cart_payment", lang)}
              </label>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod("CASH_ON_DELIVERY")} 
                  className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-all ${paymentMethod === "CASH_ON_DELIVERY" ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-border hover:bg-muted hover:border-primary/30"}`}
                >
                  {t("cart_cod", lang)}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod("BANK_TRANSFER")} 
                  className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-all ${paymentMethod === "BANK_TRANSFER" ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-border hover:bg-muted hover:border-primary/30"}`}
                >
                  {t("cart_vietqr", lang)}
                </button>
              </div>
            </div>

            {/* Terms Agreement - Right aligned checkbox */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <label htmlFor="checkoutAgreeTerms" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2">
                {t("cart_agree", lang)} <a href="#" className="text-primary hover:underline">{t("cart_terms", lang)}</a>
              </label>
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="checkoutAgreeTerms" 
                  checked={checkoutAgreeTerms} 
                  onChange={(e) => setCheckoutAgreeTerms(e.target.checked)} 
                  className="peer h-5 w-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 appearance-none cursor-pointer transition-all"
                  required 
                />
                <FontAwesomeIcon 
                  icon={faCheckCircle} 
                  className="absolute inset-0 h-5 w-5 text-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                />
              </div>
            </div>

            {checkoutError && <p className="text-sm text-red-500 text-center bg-red-50 border border-red-200 rounded-lg p-3">{checkoutError}</p>}

            {/* Order Summary */}
            <div className="border border-border bg-muted/25 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-foreground text-center flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
                {lang === "vi" ? "Tóm tắt đơn hàng" : "Order Summary"}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">{t("cart_subtotal", lang)}</span>
                  <span className="font-semibold">{formatVND(rawTotal)}</span>
                </div>
                
                {proteinDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5" />
                      {lang === "vi" ? "Giảm protein (≥1kg/loại)" : "Protein discount (≥1kg/type)"}
                    </span>
                    <span className="font-semibold">-{formatVND(proteinDiscountAmount)}</span>
                  </div>
                )}
                
                {orderDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5" />
                      {lang === "vi" ? `Giảm đơn hàng (${cartPricing.orderDiscountPercent || 0}%)` : `Order discount (${cartPricing.orderDiscountPercent || 0}%)`}
                    </span>
                    <span className="font-semibold">-{formatVND(orderDiscountAmount)}</span>
                  </div>
                )}
                
                {hasActivePlanDiscount && (
                  <div className="flex justify-between text-emerald-600 py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5" />
                      {lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}
                    </span>
                    <span className="font-semibold">-{formatVND(planDiscountAmount)}</span>
                  </div>
                )}
                
                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 py-1 border-b border-border/50">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5" />
                      {t("cart_discount", lang)}
                    </span>
                    <span className="font-semibold">-{formatVND(couponDiscountAmount)}</span>
                  </div>
                )}

                {/* Shipping fee removed from the cart — it's calculated and collected separately, not part of this total. */}
                <div className="flex justify-between items-baseline text-lg font-bold border-t border-border pt-3 mt-1">
                  <span>{t("cart_total", lang)}</span>
                  <span className="text-primary text-xl">{formatVND(checkoutFinalTotal)}</span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmittingOrder || !checkoutAgreeTerms} 
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold py-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmittingOrder ? (
                <>
                  <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5 animate-spin" />
                  {lang === "vi" ? "Đang xử lý..." : "Processing..."}
                </>
              ) : (
                <>
                  {t("btn_checkout", lang)}
                  <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5" />
                </>
              )}
            </button>
            {!checkoutAgreeTerms && (
              <p className="text-xs text-center text-muted-foreground">
                {lang === "vi" ? "Vui lòng đồng ý với điều khoản để tiếp tục" : "Please agree to terms to continue"}
              </p>
            )}
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setCartOpen(false)} />
      
      {/* Cart Drawer - Fixed sidebar on all screen sizes */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-semibold font-heading">{t("cart_title", lang)} ({cartCount})</h3>
          <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors">
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
        </div>
        
        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <FontAwesomeIcon icon={faShoppingBag} className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-base text-muted-foreground font-medium">{t("cart_empty", lang)}</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">{cart.map((item) => (<CartItem key={item.menuItem.id} item={item} lang={lang} onUpdateQty={updateCartQuantity} onRemove={removeFromCart} />))}</div>
              
              {/* Order Summary */}
              <div className="border-t border-border/40 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("cart_subtotal", lang)}</span>
                  <span className="font-semibold">{formatVND(rawTotal)}</span>
                </div>
                
                {proteinDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
                      {lang === "vi" ? "Giảm protein (≥1kg/loại)" : "Protein discount (≥1kg/type)"}
                    </span>
                    <span className="font-semibold">-{formatVND(proteinDiscountAmount)}</span>
                  </div>
                )}
                
                {orderDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
                      {lang === "vi" ? `Giảm đơn hàng (${cartPricing.orderDiscountPercent || 0}%)` : `Order discount (${cartPricing.orderDiscountPercent || 0}%)`}
                    </span>
                    <span className="font-semibold">-{formatVND(orderDiscountAmount)}</span>
                  </div>
                )}
                
                {hasActivePlanDiscount && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
                      {lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}
                    </span>
                    <span className="font-semibold">-{formatVND(planDiscountAmount)}</span>
                  </div>
                )}
                
                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
                      {t("cart_discount", lang)}
                    </span>
                    <span className="font-semibold">-{formatVND(couponDiscountAmount)}</span>
                  </div>
                )}
                
                {/* Shipping fee removed from the cart — it's calculated and collected separately, not part of this total. */}
                <div className="flex justify-between items-baseline text-lg font-bold border-t border-border pt-3 mt-2">
                  <span>{t("cart_total", lang)}</span>
                  <span className="text-primary text-xl">{formatVND(checkoutFinalTotal)}</span>
                </div>
                
                <button 
                  onClick={() => setCheckoutStep("details")} 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold py-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {t("btn_checkout", lang)}
                  <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
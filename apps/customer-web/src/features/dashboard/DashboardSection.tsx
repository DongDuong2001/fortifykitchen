"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faWallet, faCalendarAlt, faTruck, faSearch, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS, PROTEIN_LABELS } from "@/constants/order-status";
import { formatVND, formatGrams } from "@fortifykitchen/shared";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

function formatIntervalLabel(days: number): string {
  if (days === 1) return "ngày";
  if (days === 7) return "tuần";
  return `${days} ngày`;
}

interface DashboardSectionProps {
  lang: "vi" | "en";
  user: any;
  myOrders: any[];
  mySubscriptions: any[];
  isLoadingDashboard: boolean;
  dashboardSection: "overview" | "orders" | "subscriptions";
  setDashboardSection: (section: "overview" | "orders" | "subscriptions") => void;
  trackPhone: string;
  setTrackPhone: (phone: string) => void;
  trackedOrders: any[];
  isTrackingLoading: boolean;
  trackingError: string | null;
  hasTracked: boolean;
  handleTrackOrders: (e: React.FormEvent) => Promise<void>;
  setAuthModal: (modal: "login" | "signup" | null) => void;
}

export default function DashboardSection({
  lang,
  user,
  myOrders,
  mySubscriptions,
  isLoadingDashboard,
  dashboardSection,
  setDashboardSection,
  trackPhone,
  setTrackPhone,
  trackedOrders,
  isTrackingLoading,
  trackingError,
  hasTracked,
  handleTrackOrders,
  setAuthModal,
}: DashboardSectionProps) {
  const [_orderDetail, setOrderDetail] = React.useState<any | null>(null);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <FontAwesomeIcon icon={faShoppingBag} className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">{t("dash_title", lang)}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t("filter_all", lang)}</p>
          <button onClick={() => setAuthModal("login")} className="bg-primary text-primary-foreground text-xs font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all cursor-pointer">{t("btn_signin", lang)}</button>
        </div>

        <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold font-heading mb-4">{t("filter_all", lang)}</h3>
          <form onSubmit={handleTrackOrders} className="space-y-4">
            <div className="flex gap-2">
              <input type="tel" placeholder={t("filter_all", lang)} value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" />
              <button type="submit" disabled={isTrackingLoading || !trackPhone.trim()} className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"><FontAwesomeIcon icon={faSearch} className="h-4 w-4" />{isTrackingLoading ? "⋯" : t("filter_all", lang)}</button>
            </div>
            {trackingError && <p className="text-xs text-red-500">{trackingError}</p>}
          </form>
          {hasTracked && trackedOrders.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("filter_all", lang)}</h4>
              {trackedOrders.map((o: any) => (<OrderCard key={o.id} order={o} lang={lang} />))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoadingDashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <FontAwesomeIcon icon={faShoppingBag} className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">{t("filter_all", lang)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
        {["overview", "orders", "subscriptions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setDashboardSection(tab as any)}
            className={`py-2 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${dashboardSection === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t("filter_all", lang)}
          </button>
        ))}
      </div>

      {dashboardSection === "overview" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <FontAwesomeIcon icon={faWallet} className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold font-heading">{t("dash_balance", lang)}</h3>
              </div>
              {user.planDiscountPercent > 0 && user.planDiscountEndsAt && new Date(user.planDiscountEndsAt) > new Date() && (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {t("filter_all", lang)}
                </span>
              )}
            </div>
            <div className="text-4xl font-bold font-heading text-foreground mb-2">{formatVND(user.walletBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">{t("filter_all", lang)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("filter_all", lang), value: myOrders.length, icon: faShoppingBag },
              { label: t("filter_all", lang), value: mySubscriptions.filter((s: any) => s.status === "ACTIVE").length, icon: faCalendarAlt },
              { label: t("filter_all", lang), value: myOrders.filter((o: any) => ["PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)).length, icon: faTruck },
              { label: t("filter_all", lang), value: myOrders.filter((o: any) => o.status === "COMPLETED").length, icon: faCheckCircle }
            ].map((item, idx) => (
              <div key={idx} className="bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="text-lg font-bold font-heading mt-1">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold font-heading mb-4">{t("filter_all", lang)}</h3>
            {myOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("dash_orders_empty", lang)}</p>
            ) : (
              <div className="space-y-3">
                {myOrders.slice(0, 5).map((o: any) => (
                  <div key={o.id} onClick={() => setOrderDetail(o)} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-foreground">{o.customerName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <span className="font-bold text-primary">{formatVND(o.total)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${o.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {o.fulfillmentType === "IMMEDIATE" ? t("filter_all", lang) : t("filter_all", lang)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {ORDER_STATUS_LABELS[lang][o.status] || o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {dashboardSection === "orders" && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <FontAwesomeIcon icon={faShoppingBag} className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">{t("dash_orders_empty", lang)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((o: any) => (
                <div key={o.id} onClick={() => setOrderDetail(o)} className="border border-border bg-card rounded-2xl p-5 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.deliveryDate).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <span className="font-bold text-primary">{formatVND(o.total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center mt-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${o.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {o.fulfillmentType === "IMMEDIATE" ? t("filter_all", lang) : t("filter_all", lang)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[o.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {ORDER_STATUS_LABELS[lang][o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dashboardSection === "subscriptions" && (
        <div className="space-y-4">
          {mySubscriptions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">{t("dash_subs_empty", lang)}</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {mySubscriptions.map((sub: any) => (
                <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold font-heading truncate">{sub.packageName}</h4>
                      <p className="text-xs text-muted-foreground truncate">{sub.customerName || "Customer"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${sub.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : sub.status === "COMPLETED" ? "bg-primary/10 border-primary/20 text-primary" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(sub.pools || []).map((p: any) => {
                      const poolPct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold">{PROTEIN_LABELS[p.protein] || p.protein}</span>
                            <span className="text-muted-foreground">{formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} {t("filter_all", lang)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${poolPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>Giao {formatGrams(sub.deliveryAmountGrams)} / {formatIntervalLabel(sub.deliveryIntervalDays)}</div>
                    <div className="text-right font-bold text-primary">{formatVND(sub.totalPrice)}</div>
                    <div>Thanh toán: {sub.paymentStatus}</div>
                    <div className="text-right">{sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${Math.round((sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0) / (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 1) * 100)}% {t("filter_all", lang)}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, lang }: { order: any; lang: "vi" | "en" }) {
  return (
    <div className="border border-border bg-card rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.deliveryDate).toLocaleDateString("vi-VN")}</p>
        </div>
        <span className="font-bold text-primary">{formatVND(order.total)}</span>
      </div>
      <div className="flex gap-2 mt-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {order.fulfillmentType === "IMMEDIATE" ? t("filter_all", lang) : t("filter_all", lang)}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[order.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {ORDER_STATUS_LABELS[lang][order.status] || order.status}
        </span>
      </div>
    </div>
  );
}
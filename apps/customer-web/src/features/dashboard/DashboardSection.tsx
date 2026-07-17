"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faWallet, faCalendarAlt, faTruck, faSearch, faCheckCircle, faClock, faCheck, faUtensils, faTimes } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS, PROTEIN_LABELS, ORDER_HISTORY_STATUS_GROUPS } from "@/constants/order-status";
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
  const [orderDetail, setOrderDetail] = React.useState<any | null>(null);
  const [orderHistoryGroup, setOrderHistoryGroup] = React.useState("all");

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="border border-dashed border-border rounded-2xl p-8 text-center bg-card shadow-sm">
          <FontAwesomeIcon icon={faShoppingBag} className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">{t("dash_title", lang)}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {lang === "vi" 
              ? "Vui lòng đăng nhập tài khoản thành viên để quản lý đơn hàng và số dư ví của bạn." 
              : "Please log in to manage your orders and wallet balance."}
          </p>
          <button onClick={() => setAuthModal("login")} className="bg-primary text-primary-foreground text-xs font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all cursor-pointer">{t("btn_signin", lang)}</button>
        </div>

        <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold font-heading mb-4">
            {lang === "vi" ? "Tra cứu đơn hàng nhanh" : "Quick Order Tracking"}
          </h3>
          <form onSubmit={handleTrackOrders} className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="tel" 
                placeholder={lang === "vi" ? "Nhập số điện thoại đặt hàng..." : "Enter your phone number..."} 
                value={trackPhone} 
                onChange={(e) => setTrackPhone(e.target.value)} 
                className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" 
              />
              <button 
                type="submit" 
                disabled={isTrackingLoading || !trackPhone.trim()} 
                className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                {isTrackingLoading ? "⋯" : (lang === "vi" ? "Tìm kiếm" : "Search")}
              </button>
            </div>
            {trackingError && <p className="text-xs text-red-500">{trackingError}</p>}
          </form>
          {hasTracked && trackedOrders.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {lang === "vi" ? "Kết quả tra cứu" : "Search Results"}
              </h4>
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
        <span className="text-xs text-muted-foreground font-semibold">
          {lang === "vi" ? "Đang tải dữ liệu..." : "Loading dashboard..."}
        </span>
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
            {tab === "overview"
              ? (lang === "vi" ? "Tổng quan" : "Overview")
              : tab === "orders"
              ? (lang === "vi" ? "Đơn hàng" : "Orders")
              : (lang === "vi" ? "Gói định kỳ" : "Subscriptions")
            }
          </button>
        ))}
      </div>

      {dashboardSection === "overview" && (
        <div className="space-y-6">
          {/* Stable Solid Card for Wallet Balance (No Gradient) */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FontAwesomeIcon icon={faWallet} className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold font-heading">{t("dash_balance", lang)}</h3>
              </div>
              {user.planDiscountPercent > 0 && user.planDiscountEndsAt && new Date(user.planDiscountEndsAt) > new Date() && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {lang === "vi" ? "Khuyến mãi hội viên đang kích hoạt" : "Active Member Discount"}
                </span>
              )}
            </div>
            <div className="text-4xl font-extrabold font-heading text-foreground mb-2">{formatVND(user.walletBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {lang === "vi" ? "Số dư khả dụng dùng để mua đồ ăn hoặc đăng ký gói định kỳ" : "Available balance for ordering meals or subscription packages"}
            </p>
          </div>

          {/* Solid Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: lang === "vi" ? "Tổng số đơn" : "Total Orders", value: myOrders.length, icon: faShoppingBag },
              { label: lang === "vi" ? "Gói đang chạy" : "Active Subscriptions", value: mySubscriptions.filter((s: any) => s.status === "ACTIVE").length, icon: faCalendarAlt },
              { label: lang === "vi" ? "Đơn đang giao" : "In Delivery", value: myOrders.filter((o: any) => ["PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)).length, icon: faTruck },
              { label: lang === "vi" ? "Đơn hoàn thành" : "Completed Orders", value: myOrders.filter((o: any) => o.status === "COMPLETED").length, icon: faCheckCircle }
            ].map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="text-2xl font-black font-heading mt-1 text-foreground">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold font-heading mb-4">
              {lang === "vi" ? "Đơn hàng gần đây" : "Recent Orders"}
            </h3>
            {myOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("dash_orders_empty", lang)}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myOrders.slice(0, 4).map((o: any) => (
                  <div 
                    key={o.id} 
                    onClick={() => setOrderDetail(o)} 
                    className="border border-border bg-card p-4 rounded-xl space-y-2.5 text-xs cursor-pointer hover:border-primary/40 shadow-sm transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-foreground">{o.customerName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <span className="font-bold text-primary">{formatVND(o.total)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${o.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {o.fulfillmentType === "IMMEDIATE" ? (lang === "vi" ? "Giao ngay" : "Immediate") : (lang === "vi" ? "Đặt lịch" : "Scheduled")}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[o.status] || "bg-primary/10 text-primary border-primary/20"}`}>
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
          {/* Shopee-style status buckets */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {ORDER_HISTORY_STATUS_GROUPS.map((group) => {
              const statuses = group.statuses as string[] | null;
              const count = statuses === null ? myOrders.length : myOrders.filter((o: { status: string }) => statuses!.includes(o.status)).length;
              const isActive = orderHistoryGroup === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => setOrderHistoryGroup(group.key)}
                  className={`shrink-0 text-xs font-bold px-3.5 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap ${isActive ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {lang === "vi" ? group.vi : group.en}
                  {count > 0 && <span className="ml-1.5 opacity-80">({count})</span>}
                </button>
              );
            })}
          </div>

          {(() => {
            const activeGroup = ORDER_HISTORY_STATUS_GROUPS.find((g) => g.key === orderHistoryGroup);
            const statuses = activeGroup?.statuses as string[] | null;
            const filteredOrders = statuses === null ? myOrders : myOrders.filter((o: { status: string }) => statuses!.includes(o.status));
            if (filteredOrders.length === 0) {
              return (
                <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-card">
                  <p className="text-xs text-muted-foreground">
                    {lang === "vi" ? "Không có đơn nào trong mục này." : "No orders in this status."}
                  </p>
                </div>
              );
            }
            return filteredOrders.map((order) => (
              <div key={order.id} onClick={() => setOrderDetail(order)} className="border border-border bg-card rounded-2xl p-5 md:p-6 space-y-6 shadow-sm cursor-pointer hover:border-primary/30 transition-all duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">{t("order_id", lang)}</div>
                    <div className="text-xs font-mono font-bold text-foreground/80">FK{order.id.slice(0, 8)}</div>
                    {order.createdAt && (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {lang === "vi" ? "Đặt lúc: " : "Placed: "}
                        {new Date(order.createdAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-muted/60 text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
                      {formatVND(order.total)}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[order.status] || "bg-primary/10 text-primary border-primary/20"}`}
                    >
                      {ORDER_STATUS_LABELS[lang][order.status] || order.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden relative">
                        {item.imageUrl ? (<img src={item.imageUrl} alt={item.flavor} className="w-full h-full object-cover" />) : (<FontAwesomeIcon icon={faUtensils} className="h-5 w-5 text-muted-foreground/30 mx-auto my-auto" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.flavor}</p>
                        <p className="text-xs text-muted-foreground">{formatVND(item.unitPrice)} × {item.qty}</p>
                        {(item.proteinGrams || item.carbGrams || item.fatGrams) && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-3">
                            {item.proteinGrams && <span>P: {item.proteinGrams}g</span>}
                            {item.carbGrams && <span>C: {item.carbGrams}g</span>}
                            {item.fatGrams && <span>F: {item.fatGrams}g</span>}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-primary shrink-0">{formatVND(item.unitPrice * item.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Live Step Progress Indicator or Cancelled banner */}
                {order.status === "CANCELLED" ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-3.5 w-3.5 shrink-0" />
                    {lang === "vi" ? "Đơn hàng này đã bị hủy." : "This order was cancelled."}
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      {t("status_label", lang)}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 relative">
                      {/* Horizontal connecting line */}
                      <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-border -z-10" />
                      {[
                        { key: "PENDING_CONFIRMATION", label: lang === "vi" ? "Chờ xác nhận" : "Awaiting", icon: faClock },
                        { key: "CONFIRMED", label: lang === "vi" ? "Đã xác nhận" : "Confirmed", icon: faCheckCircle },
                        { key: "PREPARING", label: lang === "vi" ? "Đang chuẩn bị" : "Preparing", icon: faUtensils },
                        { key: "OUT_FOR_DELIVERY", label: lang === "vi" ? "Đang giao hàng" : "Out for delivery", icon: faTruck },
                        { key: "COMPLETED", label: lang === "vi" ? "Đã giao" : "Delivered", icon: faCheck },
                      ].map((step) => {
                        const statuses = ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"];
                        const currentIdx = statuses.indexOf(order.status);
                        const targetIdx = statuses.indexOf(step.key);
                        const isPassed = currentIdx >= targetIdx;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div
                              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isPassed ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/15" : "bg-muted border-border text-muted-foreground"}`}
                            >
                              <FontAwesomeIcon icon={step.icon} className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[9px] font-bold mt-2 text-muted-foreground leading-tight">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shipment details */}
                <div className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
                  {order.shipmentCode && (
                    <span className="font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                      {lang === "vi" ? "Mã vận đơn: " : "Tracking: "}{order.shipmentCode}
                    </span>
                  )}
                  {order.fulfillmentType === "SCHEDULED" && order.deliveryDate && (
                    <span>
                      {lang === "vi" ? "Dự kiến giao: " : "Est. delivery: "}
                      {new Date(order.deliveryDate).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" })}
                    </span>
                  )}
                  {order.paymentStatus && order.paymentStatus !== "PAID" && (
                    <span className="text-amber-600 font-semibold">
                      {lang === "vi" ? "Chưa thanh toán" : "Unpaid"}
                    </span>
                  )}
                </div>
              </div>
            ));
          })()}
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
                <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-sm">
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
                            <span className="text-muted-foreground">{formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} {lang === "vi" ? "còn lại" : "remaining"}</span>
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
                    <div className="text-right">{sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${Math.round((sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0) / (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 1) * 100)}% ${lang === "vi" ? "đã tiêu thụ" : "consumed"}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {orderDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setOrderDetail(null)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-heading">{t("order_id", lang)} FK{orderDetail.id.slice(0, 8)}</h3>
              <button onClick={() => setOrderDetail(null)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors cursor-pointer border-0 bg-transparent">
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground">{orderDetail.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(orderDetail.createdAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <span className="font-bold text-primary">{formatVND(orderDetail.total)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center mt-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${orderDetail.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {orderDetail.fulfillmentType === "IMMEDIATE" ? (lang === "vi" ? "Giao ngay" : "Immediate") : (lang === "vi" ? "Đặt lịch" : "Scheduled")}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[orderDetail.status] || "bg-primary/10 text-primary border-primary/20"}`}>
                  {ORDER_STATUS_LABELS[lang][orderDetail.status] || orderDetail.status}
                </span>
              </div>
              <div className="space-y-3 pt-3 border-t border-border/50">
                {(orderDetail.items || []).map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden relative">
                      {item.imageUrl ? (<img src={item.imageUrl} alt={item.flavor} className="w-full h-full object-cover" />) : (<FontAwesomeIcon icon={faUtensils} className="h-5 w-5 text-muted-foreground/30 mx-auto my-auto" />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.flavor}</p>
                      <p className="text-xs text-muted-foreground">{formatVND(item.unitPrice)} × {item.qty}</p>
                      {(item.proteinGrams || item.carbGrams || item.fatGrams) && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-3">
                          {item.proteinGrams && <span>P: {item.proteinGrams}g</span>}
                          {item.carbGrams && <span>C: {item.carbGrams}g</span>}
                          {item.fatGrams && <span>F: {item.fatGrams}g</span>}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-primary shrink-0">{formatVND(item.unitPrice * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, lang }: { order: any; lang: "vi" | "en" }) {
  return (
    <div className="border border-border bg-card rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.deliveryDate).toLocaleDateString("vi-VN")}</p>
        </div>
        <span className="font-bold text-primary">{formatVND(order.total)}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.fulfillmentType === "IMMEDIATE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {order.fulfillmentType === "IMMEDIATE" ? (lang === "vi" ? "Giao ngay" : "Immediate") : (lang === "vi" ? "Đặt lịch" : "Scheduled")}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[order.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {ORDER_STATUS_LABELS[lang][order.status] || order.status}
        </span>
      </div>
    </div>
  );
}
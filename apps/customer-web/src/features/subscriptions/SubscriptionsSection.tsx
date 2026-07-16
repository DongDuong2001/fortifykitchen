import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSearch, faWallet, faXmark, faClock } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { formatVND, formatGrams, PROTEIN_LABELS } from "@fortifykitchen/shared";
import { getPlanBenefits } from "@/lib/utils";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

function formatIntervalLabel(days: number): string {
  if (days === 1) return "ngày";
  if (days === 7) return "tuần";
  return `${days} ngày`;
}

interface SubscriptionsSectionProps {
  lang: "vi" | "en";
  user: any;
  mySubscriptions: any[];
  lookupPhone: string;
  setLookupPhone: (phone: string) => void;
  myPoolSubscriptions: any[];
  isLookupLoading: boolean;
  lookupError: string | null;
  hasLookedUp: boolean;
  handleLookupSubscription: (e: React.FormEvent) => Promise<void>;
  handlePostponeMyDelivery: (orderId: string) => void;
  handlePayFromWallet: (subscriptionId: string) => Promise<void>;
  payingSubscriptionId: string | null;
  setAuthModal: (modal: "login" | "signup" | null) => void;
  walletBalance: number;
  planDiscountPercent: number;
  planDiscountEndsAt: string | null;
  subscriptionPlans: any[];
  isLoadingPlans: boolean;
  purchasingPlanId: string | null;
  showWalletPlans: boolean;
  setShowWalletPlans: (show: boolean) => void;
  selectedUpgradePlanId: string | null;
  setSelectedUpgradePlanId: (id: string | null) => void;
  upgradeRequestNotes: string;
  setUpgradeRequestNotes: (notes: string) => void;
  isSubmittingUpgradeRequest: boolean;
  handleSubmitUpgradeRequest: () => Promise<void>;
  myUpgradeRequests: any[];
  payFromWalletError: { id: string; title: string; description?: string } | null;
  handleBuyPlan: (plan: any) => Promise<void>;
}

export default function SubscriptionsSection({
  lang,
  user,
  mySubscriptions,
  lookupPhone,
  setLookupPhone,
  myPoolSubscriptions,
  isLookupLoading,
  lookupError,
  hasLookedUp,
  handleLookupSubscription,
  handlePostponeMyDelivery,
  handlePayFromWallet,
  payingSubscriptionId,
  setAuthModal,
  walletBalance,
  planDiscountPercent,
  planDiscountEndsAt,
  subscriptionPlans,
  isLoadingPlans,
  purchasingPlanId,
  showWalletPlans,
  setShowWalletPlans,
  selectedUpgradePlanId,
  setSelectedUpgradePlanId,
  upgradeRequestNotes,
  setUpgradeRequestNotes,
  isSubmittingUpgradeRequest,
  handleSubmitUpgradeRequest,
  myUpgradeRequests,
  payFromWalletError,
  handleBuyPlan,
}: SubscriptionsSectionProps) {
  const hasActivePlanDiscount = planDiscountPercent > 0 && !!planDiscountEndsAt && new Date(planDiscountEndsAt) > new Date();
  const pendingUpgradeRequest = myUpgradeRequests.find((r: any) => r.status === "PENDING");

  const formatVND = (num: number) => `${num.toLocaleString()} ₫`;

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <FontAwesomeIcon icon={faCalendarAlt} className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">{t("dash_subs_title", lang)}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t("filter_all", lang)}</p>
          <button onClick={() => setAuthModal("login")} className="bg-primary text-primary-foreground text-xs font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all cursor-pointer">{t("btn_signin", lang)}</button>
        </div>

        <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold font-heading mb-4">{t("filter_all", lang)}</h3>
          <form onSubmit={handleLookupSubscription} className="space-y-4">
            <div className="flex gap-2">
              <input type="tel" placeholder={t("filter_all", lang)} value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" />
              <button type="submit" disabled={isLookupLoading || !lookupPhone.trim()} className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"><FontAwesomeIcon icon={faSearch} className="h-4 w-4" />{isLookupLoading ? "⋯" : t("filter_all", lang)}</button>
            </div>
            {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}
          </form>

          {hasLookedUp && myPoolSubscriptions.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("filter_all", lang)}</h4>
              {myPoolSubscriptions.map((sub) => (
                <SubscriptionCard key={sub.id} sub={sub} lang={lang} onPostpone={handlePostponeMyDelivery} onPayFromWallet={handlePayFromWallet} payingSubscriptionId={payingSubscriptionId} lookupPhone={lookupPhone} payFromWalletError={payFromWalletError} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-heading">{t("filter_all", lang)}</h3>
        {mySubscriptions.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center"><FontAwesomeIcon icon={faCalendarAlt} className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">{t("dash_subs_empty", lang)}</p></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {mySubscriptions.map((sub) => (<SubscriptionCard key={sub.id} sub={sub} lang={lang} />))}
          </div>
        )}
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold font-heading mb-4">{t("filter_all", lang)}</h3>
        <form onSubmit={handleLookupSubscription} className="space-y-4">
          <div className="flex gap-2"><input type="tel" placeholder={t("filter_all", lang)} value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /><button type="submit" disabled={isLookupLoading || !lookupPhone.trim()} className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"><FontAwesomeIcon icon={faSearch} className="h-4 w-4" />{isLookupLoading ? "⋯" : t("filter_all", lang)}</button></div>
          {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}
        </form>
        {hasLookedUp && myPoolSubscriptions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("filter_all", lang)}</h4>
            {myPoolSubscriptions.map((sub) => (
              <SubscriptionCard key={sub.id} sub={sub} lang={lang} onPostpone={handlePostponeMyDelivery} onPayFromWallet={handlePayFromWallet} payingSubscriptionId={payingSubscriptionId} lookupPhone={lookupPhone} payFromWalletError={payFromWalletError} />
            ))}
          </div>
        )}
      </div>

      {user && showWalletPlans && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowWalletPlans(false)} />
          <div className="relative w-full max-w-6xl bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 z-10 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold font-heading">
                {lang === "vi" ? "Chọn gói nạp ví" : "Choose a top-up pack"}
              </h3>
              <button
                onClick={() => setShowWalletPlans(false)}
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            {hasActivePlanDiscount ? (
              (() => {
                if (pendingUpgradeRequest) {
                  return (
                    <div className="max-w-lg mx-auto text-center py-6 px-6 border border-primary/20 bg-primary/5 rounded-xl">
                      <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm font-bold">
                        {lang === "vi" ? "Yêu cầu nâng cấp đang chờ duyệt" : "Upgrade request pending review"}
                      </p>
                      <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">
                        {lang === "vi"
                          ? `Bạn đã yêu cầu chuyển sang "${pendingUpgradeRequest.requestedPlanName ?? ""}". Đội ngũ Fortify Kitchen sẽ xem xét và liên hệ sớm.`
                          : `You asked to move to "${pendingUpgradeRequest.requestedPlanName ?? ""}". Our team will review it and reach out soon.`}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="max-w-lg mx-auto space-y-4">
                    <div className="text-center py-3 px-5 border border-amber-200 bg-amber-50 rounded-xl">
                      <p className="text-xs text-amber-700">
                        {lang === "vi"
                          ? `Bạn đang có ưu đãi từ gói hiện tại (còn ${formatVND(walletBalance)} trong ví). Chọn gói bạn muốn nâng cấp lên bên dưới — số dư hiện tại sẽ được trừ vào gói mới, bạn chỉ cần chuyển thêm phần chênh lệch.`
                          : `You already have an active plan discount (${formatVND(walletBalance)} left in your wallet). Pick the tier you'd like to move to below — your current balance counts toward it, you'll only need to transfer the difference.`}
                      </p>
                    </div>

                    {isLoadingPlans ? (
                      <div className="flex justify-center py-6">
                        <FontAwesomeIcon icon={faWallet} className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {subscriptionPlans.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => setSelectedUpgradePlanId(plan.id)}
                            className={`w-full flex items-center justify-between gap-3 border rounded-xl p-3.5 text-left transition-all cursor-pointer ${
                              selectedUpgradePlanId === plan.id
                                ? "border-2 border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-bold">{plan.name}</p>
                              {plan.voucherPercent > 0 && (
                                <p className="text-[11px] text-primary font-semibold mt-0.5">
                                  {lang === "vi" ? `-${plan.voucherPercent}% mọi đơn` : `-${plan.voucherPercent}% every order`}
                                </p>
                              )}
                            </div>
                            <span className="text-base font-extrabold font-heading text-primary shrink-0">
                              {formatVND(plan.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      value={upgradeRequestNotes}
                      onChange={(e) => setUpgradeRequestNotes(e.target.value)}
                      placeholder={lang === "vi" ? "Ghi chú thêm cho đội ngũ (không bắt buộc)" : "Any notes for our team (optional)"}
                      rows={2}
                      className="w-full border border-border rounded-lg p-3 text-xs bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <button
                      onClick={handleSubmitUpgradeRequest}
                      disabled={!selectedUpgradePlanId || isSubmittingUpgradeRequest}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-sm py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingUpgradeRequest ? (
                        <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5 animate-spin" />
                      ) : lang === "vi" ? (
                        "Gửi yêu cầu nâng cấp"
                      ) : (
                        "Send upgrade request"
                      )}
                    </button>
                  </div>
                );
              })()
            ) : isLoadingPlans ? (
              <div className="flex justify-center py-10">
                <FontAwesomeIcon icon={faWallet} className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <p className="text-xs text-foreground/70">
                  {lang === "vi" ? "Chưa có gói nạp nào. Trong lúc chờ, bạn có thể đặt món lẻ từ thực đơn." : "No top-up packs available yet. Meanwhile, you can order individual meals from the menu."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subscriptionPlans.map((plan) => {
                  const benefits = getPlanBenefits(plan.voucherPercent || 0, lang);
                  
                  // Color theme based on voucher percent
                  const getPlanTheme = (voucherPercent: number) => {
                    if (voucherPercent >= 25) return { bg: "bg-gradient-to-br from-[linear-gradient(135deg,#1E2016_0%,#2E7D32_100%)]", border: "border-transparent", accent: "text-white", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40", btn: "bg-amber-500 hover:bg-amber-400 text-white", iconColor: "text-amber-400" };
                    if (voucherPercent >= 20) return { bg: "bg-card", border: "border-border", accent: "text-amber-600", badge: "bg-amber-500/10 text-amber-600 border-amber-500/30", btn: "border-2 border-amber-500 text-amber-600 bg-transparent hover:bg-amber-500 hover:text-white", iconColor: "text-amber-600" };
                    if (voucherPercent >= 15) return { bg: "bg-gradient-to-br from-[linear-gradient(135deg,#1E2016_0%,#2E7D32_100%)]", border: "border-primary", accent: "text-white", badge: "bg-primary-foreground/10 text-white border-white/30", btn: "bg-white hover:bg-primary-foreground/90 text-primary", iconColor: "text-white" };
                    if (voucherPercent >= 10) return { bg: "bg-primary", border: "border-primary", accent: "text-primary-foreground", badge: "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30", btn: "bg-primary-foreground hover:bg-primary-foreground/90 text-primary", iconColor: "text-primary-foreground" };
                    return { bg: "bg-card", border: "border-border", accent: "text-primary", badge: "bg-primary/10 text-primary border-primary/20", btn: "border-2 border-primary text-primary bg-transparent hover:bg-primary/5", iconColor: "text-primary" };
                  };
                  
                  const theme = getPlanTheme(plan.voucherPercent || 0);
                  const isFeatured = plan.voucherPercent >= 10;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-2xl p-6 space-y-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary ${theme.bg} ${theme.border}`}
                    >
                      {isFeatured && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${theme.badge}`}>
                          {lang === "vi" ? "Phổ biến nhất" : "Most popular"}
                        </span>
                      )}
                      <div className="flex justify-between items-start gap-2 min-h-12">
                        <h4 className="text-base font-bold font-heading {theme.accent}">{plan.name}</h4>
                        {plan.voucherPercent > 0 && (
                          <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border shrink-0 ${theme.accent} ${theme.badge}`}>
                            {lang === "vi" ? `-${plan.voucherPercent}% mọi đơn` : `-${plan.voucherPercent}% every order`}
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold font-heading {theme.accent}">{formatVND(plan.price)}</p>
                      <ul className="space-y-2.5 flex-1">
                        {benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed">
                            <FontAwesomeIcon icon={b.icon} className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${theme.iconColor}`} />
                            <span className={theme.accent}>{b.text}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleBuyPlan(plan)}
                        disabled={purchasingPlanId === plan.id || hasActivePlanDiscount}
                        className={`w-full font-bold py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${theme.btn}`}
                      >
                        {purchasingPlanId === plan.id ? (
                          <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5" />
                            {lang === "vi" ? "Nạp ví ngay" : "Top up now"}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ sub, lang, onPostpone, onPayFromWallet, payingSubscriptionId, payFromWalletError }: any) {
  const totalRemaining = (sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0);
  const totalPurchased = (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 0);
  const pct = totalPurchased > 0 ? Math.round((totalRemaining / totalPurchased) * 100) : 0;

  return (
    <div className="border border-border bg-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start gap-3"><div className="min-w-0"><h4 className="text-sm font-bold font-heading truncate">{sub.packageName}</h4><p className="text-xs text-muted-foreground truncate">{sub.customerName || "Customer"}</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${sub.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : sub.status === "COMPLETED" ? "bg-primary/10 border-primary/20 text-primary" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{sub.status}</span></div>
      <div className="space-y-2">{(sub.pools || []).map((p: any) => {const poolPct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;return(<div key={p.id} className="space-y-1"><div className="flex justify-between text-[11px]"><span className="font-semibold">{PROTEIN_LABELS[p.protein as keyof typeof PROTEIN_LABELS] || p.protein}</span><span className="text-muted-foreground">{formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} {t("filter_all", lang)}</span></div><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${poolPct}%` }} /></div></div>);})}</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground"><div>Giao {formatGrams(sub.deliveryAmountGrams)} / {formatIntervalLabel(sub.deliveryIntervalDays)}</div><div className="text-right font-bold text-primary">{formatVND(sub.totalPrice)}</div><div>Thanh toán: {sub.paymentStatus}</div><div className="text-right">{sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${pct}% {t("filter_all", lang)}`}</div></div>
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30"><button onClick={() => onPostpone(sub.id)} className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer">{t("filter_all", lang)}</button>{sub.paymentStatus !== "PAID" && (<button onClick={() => onPayFromWallet(sub.id)} disabled={payingSubscriptionId === sub.id} className="flex-1 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-bold rounded-md cursor-pointer disabled:opacity-50">{payingSubscriptionId === sub.id ? "⋯" : t("filter_all", lang)}</button>)}</div>
      {payFromWalletError && payFromWalletError.id === sub.id && (
        <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
          <p className="font-bold">{payFromWalletError.title}</p>
          {payFromWalletError.description && <p className="mt-0.5 opacity-90">{payFromWalletError.description}</p>}
        </div>
      )}
    </div>
  );
}
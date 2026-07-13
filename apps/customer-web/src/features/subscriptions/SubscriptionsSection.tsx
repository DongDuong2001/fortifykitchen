import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";
import { formatVND, formatGrams, PROTEIN_LABELS } from "@fortifykitchen/shared";

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
  setMyPoolSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
  isLookupLoading: boolean;
  lookupError: string | null;
  hasLookedUp: boolean;
  setHasLookedUp: (v: boolean) => void;
  handleLookupSubscription: (e: React.FormEvent) => Promise<void>;
  handlePostponeMyDelivery: (orderId: string) => void;
  handlePayFromWallet: (subscriptionId: string) => Promise<void>;
  payingSubscriptionId: string | null;
  setAuthModal: (modal: "login" | "signup" | null) => void;
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
}: SubscriptionsSectionProps) {
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
                <SubscriptionCard key={sub.id} sub={sub} lang={lang} onPostpone={handlePostponeMyDelivery} onPayFromWallet={handlePayFromWallet} payingSubscriptionId={payingSubscriptionId} lookupPhone={lookupPhone} />
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
              <SubscriptionCard key={sub.id} sub={sub} lang={lang} onPostpone={handlePostponeMyDelivery} onPayFromWallet={handlePayFromWallet} payingSubscriptionId={payingSubscriptionId} lookupPhone={lookupPhone} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({ sub, lang, onPostpone, onPayFromWallet, payingSubscriptionId }: any) {
  const totalRemaining = (sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0);
  const totalPurchased = (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 0);
  const pct = totalPurchased > 0 ? Math.round((totalRemaining / totalPurchased) * 100) : 0;

  return (
    <div className="border border-border bg-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start gap-3"><div className="min-w-0"><h4 className="text-sm font-bold font-heading truncate">{sub.packageName}</h4><p className="text-xs text-muted-foreground truncate">{sub.customerName || "Customer"}</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${sub.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : sub.status === "COMPLETED" ? "bg-primary/10 border-primary/20 text-primary" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{sub.status}</span></div>
      <div className="space-y-2">{(sub.pools || []).map((p: any) => {const poolPct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;return(<div key={p.id} className="space-y-1"><div className="flex justify-between text-[11px]"><span className="font-semibold">{PROTEIN_LABELS[p.protein as keyof typeof PROTEIN_LABELS] || p.protein}</span><span className="text-muted-foreground">{formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} {t("filter_all", lang)}</span></div><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${poolPct}%` }} /></div></div>);})}</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground"><div>Giao {formatGrams(sub.deliveryAmountGrams)} / {formatIntervalLabel(sub.deliveryIntervalDays)}</div><div className="text-right font-bold text-primary">{formatVND(sub.totalPrice)}</div><div>Thanh toán: {sub.paymentStatus}</div><div className="text-right">{sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${pct}% {t("filter_all", lang)}`}</div></div>
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30"><button onClick={() => onPostpone(sub.id)} className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer">{t("filter_all", lang)}</button>{sub.paymentStatus !== "PAID" && (<button onClick={() => onPayFromWallet(sub.id)} disabled={payingSubscriptionId === sub.id} className="flex-1 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-bold rounded-md cursor-pointer disabled:opacity-50">{payingSubscriptionId === sub.id ? "⋯" : t("filter_all", lang)}</button>)}</div>
    </div>
  );
}
"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faCreditCard, faShoppingBag, faXmark, faClock } from "@fortawesome/free-solid-svg-icons";
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
  setShowWalletPlans: (show: boolean) => void;
  showWalletPlans: boolean;
  selectedUpgradePlanId: string | null;
  setSelectedUpgradePlanId: (id: string | null) => void;
  upgradeRequestNotes: string;
  setUpgradeRequestNotes: (notes: string) => void;
  isSubmittingUpgradeRequest: boolean;
  handleSubmitUpgradeRequest: () => Promise<void>;
  myUpgradeRequests: any[];
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
  setShowWalletPlans,
  showWalletPlans,
  selectedUpgradePlanId,
  setSelectedUpgradePlanId,
  upgradeRequestNotes,
  setUpgradeRequestNotes,
  isSubmittingUpgradeRequest,
  handleSubmitUpgradeRequest,
  myUpgradeRequests,
}: WalletSectionProps) {
  const hasActivePlanDiscount = planDiscountPercent > 0 && !!planDiscountEndsAt && new Date(planDiscountEndsAt) > new Date();

  const formatVND = (num: number) => `${num.toLocaleString()} ₫`;

  const pendingUpgradeRequest = user ? myUpgradeRequests.find((r: any) => r.status === "PENDING") : null;

  return (
    <div className="space-y-6">
      {user ? (
        <div className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 text-primary"><FontAwesomeIcon icon={faWallet} className="h-5 w-5" /></div>
              <h3 className="text-sm font-bold font-heading">{t("dash_balance", lang)}</h3>
            </div>
            {hasActivePlanDiscount && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                {lang === "vi" ? "Đang giảm giá" : "Discount active"}
              </span>
            )}
          </div>
          <div className="text-4xl font-bold font-heading text-foreground mb-2">{formatVND(walletBalance)}</div>
          {hasActivePlanDiscount ? (
            <p className="text-[11px] text-primary mt-2 leading-relaxed">
              {lang === "vi"
                ? `Đang giảm ${planDiscountPercent}% mọi đơn — áp dụng đến khi hết số dư ví · dùng cho món lẻ hoặc gói định kỳ.`
                : `${planDiscountPercent}% off every order — applies until your wallet balance runs out · spend on meals or a subscription.`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {lang === "vi"
                ? "Nạp một gói nạp dưới đây để nhận ưu đãi giảm giá tự động."
                : "Purchase a top-up pack below to unlock automatic discounts."}
            </p>
          )}
          <button
            onClick={() => setShowWalletPlans(true)}
            className="mt-4 shrink-0 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-sm px-5 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5" />
            {lang === "vi" ? "Nạp thêm vào ví" : "Add Money to Wallet"}
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto mb-8 text-center py-8 px-6 border border-dashed border-border rounded-2xl bg-card/50">
          <div className="p-3 rounded-full bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faWallet} className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold font-heading mb-2">
            {lang === "vi" ? "Xem các gói nạp ưu đãi" : "View wallet top-up plans"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mb-4">
            {lang === "vi"
              ? "Hãy đăng nhập để xem số dư tài khoản của bạn và thực hiện nạp ví."
              : "Please sign in to view your current account balance and make top-ups."}
          </p>
        </div>
      )}

      {!user && hasActivePlanDiscount && (
        <div className="max-w-lg mx-auto mb-6 text-center py-3 px-5 border border-amber-200 bg-amber-50 rounded-xl">
          <p className="text-xs text-amber-700">
            {lang === "vi"
              ? "Bạn đang có ưu đãi từ gói hiện tại. Vui lòng liên hệ đội ngũ Fortify Kitchen nếu muốn nâng cấp gói trước khi hết số dư ví."
              : "You already have an active plan discount. Please contact our team if you'd like to upgrade before your wallet balance runs out."}
          </p>
        </div>
      )}

      {!user && (
        <>
          {!isLoadingPlans ? (
            subscriptionPlans.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <p className="text-xs text-foreground/70">
                  {lang === "vi" ? "Chưa có gói nạp nào. Trong lúc chờ, bạn có thể đặt món lẻ từ thực đơn." : "No top-up packs available yet. Meanwhile, you can order individual meals from the menu."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subscriptionPlans.map((plan) => {
                  const isFeatured = plan.voucherPercent === 10;
                  const benefits = getPlanBenefits(plan.voucherPercent || 0, lang);
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-2xl p-6 space-y-4 flex flex-col bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary ${isFeatured ? "border-2 border-primary shadow-md" : "border-border shadow-sm"}`}
                    >
                      {isFeatured && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                          {lang === "vi" ? "Phổ biến nhất" : "Most popular"}
                        </span>
                      )}
                      <div className="flex justify-between items-start gap-2 min-h-12">
                        <h4 className="text-base font-bold font-heading">{plan.name}</h4>
                        {plan.voucherPercent > 0 && (
                          <span className="text-[10px] font-black tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                            {lang === "vi" ? `-${plan.voucherPercent}% mọi đơn` : `-${plan.voucherPercent}% every order`}
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold font-heading text-primary">{formatVND(plan.price)}</p>
                      <ul className="space-y-2.5 flex-1">
                        {benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                            <FontAwesomeIcon icon={b.icon} className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{b.text}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleBuyPlan(plan)}
                        disabled={purchasingPlanId === plan.id || hasActivePlanDiscount}
                        className={`w-full font-bold py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${isFeatured ? "bg-primary hover:bg-primary/95 text-primary-foreground" : "border-2 border-primary text-primary bg-transparent hover:bg-primary/5"}`}
                      >
                        {purchasingPlanId === plan.id ? (
                          <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5 animate-spin" />
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
            )
          ) : (
            <div className="flex justify-center py-10">
              <FontAwesomeIcon icon={faShoppingBag} className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

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
                        <FontAwesomeIcon icon={faShoppingBag} className="h-6 w-6 animate-spin text-muted-foreground" />
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
                        <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5 animate-spin" />
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
                <FontAwesomeIcon icon={faShoppingBag} className="h-6 w-6 animate-spin text-muted-foreground" />
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
                  const isFeatured = plan.voucherPercent === 10;
                  const benefits = getPlanBenefits(plan.voucherPercent || 0, lang);
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-2xl p-6 space-y-4 flex flex-col bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary ${isFeatured ? "border-2 border-primary shadow-md" : "border-border shadow-sm"}`}
                    >
                      {isFeatured && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                          {lang === "vi" ? "Phổ biến nhất" : "Most popular"}
                        </span>
                      )}
                      <div className="flex justify-between items-start gap-2 min-h-12">
                        <h4 className="text-sm font-bold font-heading">{plan.name}</h4>
                        {plan.voucherPercent > 0 && (
                          <span className="text-[10px] font-black tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                            {lang === "vi" ? `-${plan.voucherPercent}% mọi đơn` : `-${plan.voucherPercent}% every order`}
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold font-heading text-primary">{formatVND(plan.price)}</p>
                      <ul className="space-y-2.5 flex-1">
                        {benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                            <FontAwesomeIcon icon={b.icon} className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{b.text}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleBuyPlan(plan)}
                        disabled={purchasingPlanId === plan.id || hasActivePlanDiscount}
                        className={`w-full font-bold py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${isFeatured ? "bg-primary hover:bg-primary/95 text-primary-foreground" : "border-2 border-primary text-primary bg-transparent hover:bg-primary/5"}`}
                      >
                        {purchasingPlanId === plan.id ? (
                          <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5 animate-spin" />
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

      {planPurchaseResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setPlanPurchaseResult(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
            <FontAwesomeIcon icon={faCreditCard} className="h-10 w-10 mx-auto text-primary" />
            <h3 className="text-sm font-bold font-heading">
              {lang === "vi" ? "Yêu cầu mua gói thành công!" : "Plan Purchase Requested!"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "vi"
                ? "Vui lòng quét mã QR dưới đây hoặc chuyển khoản thủ công để hoàn tất nạp ví."
                : "Please scan the QR code below or transfer manually to complete your wallet top-up."}
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-border w-48 h-48 mx-auto flex items-center justify-center">
              <img
                src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${planPurchaseResult.amount}&addInfo=${planPurchaseResult.memo}&accountName=FORTIFY%20KITCHEN`}
                alt="VietQR Payment Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="border border-border bg-muted/20 rounded-xl p-3 space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "vi" ? "Ngân hàng" : "Bank"}</span>
                <span className="font-semibold">MB Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "vi" ? "Số tài khoản" : "Account Number"}</span>
                <span className="font-semibold font-mono">19035678901234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "vi" ? "Chủ tài khoản" : "Account Holder"}</span>
                <span className="font-semibold uppercase">FORTIFY KITCHEN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "vi" ? "Số tiền" : "Amount"}</span>
                <span className="font-bold text-primary">{formatVND(planPurchaseResult.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "vi" ? "Nội dung chuyển khoản" : "Transfer Reference"}</span>
                <span className="font-mono text-primary font-bold">{planPurchaseResult.memo}</span>
              </div>
            </div>
            <button
              onClick={() => setPlanPurchaseResult(null)}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {lang === "vi" ? "Tôi đã chuyển khoản / Đóng" : "I have transferred / Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
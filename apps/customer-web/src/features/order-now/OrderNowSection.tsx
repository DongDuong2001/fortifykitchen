"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faMagic,
  faPlus,
  faMinus,
  faInfoCircle,
  faCheckCircle,
  faUtensils,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { DICTIONARY } from "@/constants/dictionary";
import { calculateCustomOrderPrice } from "@/lib/utils";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

const PROTEIN_OPTIONS = [
  { id: "chicken", label: "Ức gà (Chicken)" },
  { id: "beef", label: "Thịt bò (Beef)" },
  { id: "shrimp", label: "Tôm thẻ (Shrimp)" },
];

const CARB_OPTIONS = [
  { id: "rice", label: "Gạo lứt (Brown Rice)" },
  { id: "potato", label: "Khoai lang (Sweet Potato)" },
  { id: "noodle", label: "Bún lứt (Brown Rice Noodles)" },
];

const TOPPING_OPTIONS = [
  { id: "broccoli", label: "Bông cải xanh (Broccoli)" },
  { id: "egg", label: "Trứng luộc (Boiled Egg)" },
  { id: "mushroom", label: "Nấm hương (Shiitake)" },
];

const SAUCE_OPTIONS = [
  { id: "sesame", label: "Xốt mè rang (Sesame)" },
  { id: "citrus", label: "Xốt cam chua ngọt (Citrus)" },
  { id: "spicy", label: "Xốt tương cay (Spicy Soy)" },
];

function groupByFlavor(items: MenuItem[]) {
  const map = new Map<string, { protein: Protein; flavor: string; sizes: MenuItem[] }>();
  for (const item of items) {
    const key = `${item.protein}::${item.flavor}`;
    if (!map.has(key)) map.set(key, { protein: item.protein, flavor: item.flavor, sizes: [] });
    map.get(key)!.sizes.push(item);
  }
  for (const dish of map.values()) {
    dish.sizes.sort((a, b) => a.sizeGrams - b.sizeGrams);
  }
  return Array.from(map.values()).sort((a, b) => a.flavor.localeCompare(b.flavor));
}

function getSelectedSize(dish: { protein: Protein; flavor: string; sizes: MenuItem[] }, selectedSizeByDish: Record<string, string>): MenuItem {
  const key = `${dish.protein}::${dish.flavor}`;
  const selectedId = selectedSizeByDish[key];
  return dish.sizes.find((s) => s.id === selectedId) ?? dish.sizes[0];
}

interface OrderNowSectionProps {
  lang: "vi" | "en";
  menuItems: MenuItem[];
  orderNowCart: { menuItem: MenuItem; qty: number }[];
  setOrderNowCart: React.Dispatch<React.SetStateAction<{ menuItem: MenuItem; qty: number }[]>>;
  orderNowName: string;
  setOrderNowName: React.Dispatch<React.SetStateAction<string>>;
  orderNowPhone: string;
  setOrderNowPhone: React.Dispatch<React.SetStateAction<string>>;
  orderNowAddress: string;
  setOrderNowAddress: React.Dispatch<React.SetStateAction<string>>;
  orderNowNotes: string;
  setOrderNowNotes: React.Dispatch<React.SetStateAction<string>>;
  orderNowResult: any;
  setOrderNowResult: React.Dispatch<React.SetStateAction<any>>;
  isSubmittingOrderNow: boolean;
  orderNowError: string | null;
  setOrderNowError: React.Dispatch<React.SetStateAction<string | null>>;
  orderFlowType: "standard" | "custom";
  setOrderFlowType: React.Dispatch<React.SetStateAction<"standard" | "custom">>;
  readyNowItems: MenuItem[];
  selectedProteinOrderNow: Protein | "";
  setSelectedProteinOrderNow: React.Dispatch<React.SetStateAction<Protein | "">>;
  isLoadingMenu: boolean;
  orderNowDiscountCode: string;
  setOrderNowDiscountCode: React.Dispatch<React.SetStateAction<string>>;
  orderNowVerifiedDiscount: { type: string; amount: number } | null;
  orderNowDiscountCodeStatus: "idle" | "checking" | "valid" | "invalid";
  orderNowDiscountCodeError: string | null;
  hasActivePlanDiscount: boolean;
  planDiscountPercent: number;
  orderNowPaymentMethod: string;
  setOrderNowPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  orderNowProvince: string;
  setOrderNowProvince: React.Dispatch<React.SetStateAction<string>>;
  orderNowWard: string;
  setOrderNowWard: React.Dispatch<React.SetStateAction<string>>;
  orderNowStreet: string;
  setOrderNowStreet: React.Dispatch<React.SetStateAction<string>>;
  orderNowAgreeTerms: boolean;
  setOrderNowAgreeTerms: React.Dispatch<React.SetStateAction<boolean>>;
  customOrderProtein: string;
  setCustomOrderProtein: React.Dispatch<React.SetStateAction<string>>;
  customOrderSize: number;
  setCustomOrderSize: React.Dispatch<React.SetStateAction<number>>;
  customOrderCarb: string;
  setCustomOrderCarb: React.Dispatch<React.SetStateAction<string>>;
  customOrderToppings: string[];
  setCustomOrderToppings: React.Dispatch<React.SetStateAction<string[]>>;
  customOrderSauce: string;
  setCustomOrderSauce: React.Dispatch<React.SetStateAction<string>>;
  customOrderDeliveryDate: string;
  setCustomOrderDeliveryDate: React.Dispatch<React.SetStateAction<string>>;
  customOrderQty: number;
  setCustomOrderQty: React.Dispatch<React.SetStateAction<number>>;
  handleSubmitOrderNow: (e?: React.FormEvent) => Promise<void>;
}

function OrderResultView({ lang, orderNowResult, setOrderNowResult, setOrderNowName, setOrderNowPhone, setOrderNowAddress, setOrderNowNotes, setOrderNowProvince, setOrderNowWard, setOrderNowStreet, setOrderNowDiscountCode, setOrderNowAgreeTerms, t, formatVND }: any) {
  return (
    <div className="max-w-md mx-auto border border-border bg-card rounded-2xl p-6 text-center space-y-5 shadow-sm">
      <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
      <h3 className="text-sm font-bold font-heading">{t("success_title", lang)}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {orderNowResult.fulfillmentType === "IMMEDIATE"
          ? (lang === "vi" ? "Đơn hàng của bạn đang được chuẩn bị để giao ngay lập tức." : "Your order is prepping for immediate delivery.")
          : (lang === "vi"
              ? `Yêu cầu đặt trước đã được gửi. Đơn hàng dự kiến giao vào ngày ${new Date(orderNowResult.deliveryDate).toLocaleDateString("vi-VN")}.`
              : `Pre-order request submitted. Delivery scheduled for ${new Date(orderNowResult.deliveryDate).toLocaleDateString("en-US")}.`)}
      </p>

      {orderNowResult.systemNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left leading-relaxed animate-in fade-in duration-200">
          <p className="font-semibold mb-0.5">{lang === "vi" ? "Thông báo hệ thống:" : "System notification:"}</p>
          <p>{orderNowResult.systemNotes}</p>
        </div>
      )}

      <div className="border border-border/60 bg-muted/15 rounded-xl p-4 text-left space-y-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/40 pb-1">
          {lang === "vi" ? "Cập nhật đơn hàng" : "Order updates"}
        </span>
        <div className="space-y-4 pt-1">
          <div className="flex gap-3 relative">
            <div className="flex flex-col items-center shrink-0">
              <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
              <div className="w-[1.5px] h-6 bg-border/80" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{lang === "vi" ? "Đã gửi đơn hàng" : "Submitted"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lang === "vi" ? "Đã nhận đơn — chúng tôi đã gửi xác nhận cho bạn qua SMS/Zalo." : "Order received — we've sent your confirmation by SMS/Zalo."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 relative">
            <div className="flex flex-col items-center shrink-0">
              <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">●</span>
              <div className="w-[1.5px] h-6 bg-border/40" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{lang === "vi" ? "Đang chờ duyệt" : "Pending Confirmation"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lang === "vi" ? "Quản lý đang kiểm tra nguyên liệu & nhân viên bếp xác nhận." : "Waiting for kitchen manager approval."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 relative">
            <div className="flex flex-col items-center shrink-0">
              <span className="h-5 w-5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-[10px]">3</span>
              <div className="w-[1.5px] h-6 bg-border/40" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{lang === "vi" ? "Đã xác nhận & Chế biến" : "Confirmed & Prepping"}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <span className="h-5 w-5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-[10px]">4</span>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{lang === "vi" ? "Đã giao hàng" : "Delivered"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("txt_total")}</span>
        <p className="text-lg font-bold text-primary">{formatVND(orderNowResult.total)}</p>
      </div>

      {orderNowResult.paymentMethod === "BANK_TRANSFER" && (
        <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-3 text-left">
          <p className="text-xs font-bold text-foreground text-center">{lang === "vi" ? "Quét mã VietQR để thanh toán" : "Scan VietQR Code to Pay"}</p>
          <div className="bg-white p-2.5 rounded-lg border border-border w-40 h-40 mx-auto flex items-center justify-center">
            <img
              src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${orderNowResult.total}&addInfo=FK${orderNowResult.id.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`}
              alt="VietQR Payment Code"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOrderNowResult(null);
          setOrderNowName("");
          setOrderNowPhone("");
          setOrderNowAddress("");
          setOrderNowNotes("");
          setOrderNowProvince("");
          setOrderNowWard("");
          setOrderNowStreet("");
          setOrderNowDiscountCode("");
          setOrderNowAgreeTerms(false);
        }}
        className="w-full text-xs font-bold py-2.5 rounded-xl border border-border hover:bg-muted cursor-pointer transition-colors"
      >
        {t("btn_order_more")}
      </button>
    </div>
  );
}

export default function OrderNowSection({
  lang,
  orderNowCart,
  setOrderNowCart,
  orderNowNotes,
  setOrderNowNotes,
  orderNowResult,
  setOrderNowResult,
  isSubmittingOrderNow,
  orderNowError,
  orderFlowType,
  setOrderFlowType,
  readyNowItems,
  selectedProteinOrderNow,
  setSelectedProteinOrderNow,
  isLoadingMenu,
  orderNowDiscountCode,
  setOrderNowDiscountCode,
  orderNowVerifiedDiscount,
  orderNowDiscountCodeStatus,
  orderNowDiscountCodeError,
  hasActivePlanDiscount,
  planDiscountPercent,
  orderNowPaymentMethod,
  setOrderNowPaymentMethod,
  orderNowProvince,
  setOrderNowProvince,
  orderNowStreet,
  setOrderNowStreet,
  orderNowAgreeTerms,
  setOrderNowAgreeTerms,
  customOrderProtein,
  setCustomOrderProtein,
  customOrderSize,
  setCustomOrderSize,
  customOrderCarb,
  setCustomOrderCarb,
  customOrderToppings,
  setCustomOrderToppings,
  customOrderSauce,
  setCustomOrderSauce,
  customOrderDeliveryDate,
  setCustomOrderDeliveryDate,
  customOrderQty,
  setCustomOrderQty,
  handleSubmitOrderNow,
  // For OrderResultView
  setOrderNowName,
  setOrderNowPhone,
  setOrderNowAddress,
  setOrderNowWard,
}: OrderNowSectionProps) {
  const [selectedSizeByDish, setSelectedSizeByDish] = React.useState<Record<string, string>>({});

  const addToOrderNowCart = (item: MenuItem) => {
    setOrderNowCart((prev) => {
      const maxQty = item.stockQuantity ?? 0;
      const idx = prev.findIndex((l) => l.menuItem.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: Math.min(updated[idx].qty + 1, maxQty) };
        return updated;
      }
      return [...prev, { menuItem: item, qty: Math.min(1, maxQty) }];
    });
  };

  const updateOrderNowQty = (itemId: string, qty: number) => {
    setOrderNowCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.menuItem.id !== itemId);
      return prev.map((l) => (l.menuItem.id === itemId ? { ...l, qty } : l));
    });
  };

  const orderNowTotal = orderNowCart.reduce((s, l) => s + l.menuItem.price * l.qty, 0);

  const orderNowDiscountAmount = orderNowVerifiedDiscount
    ? Math.min(
        Math.max(
          orderNowVerifiedDiscount.type === "PERCENTAGE" ? (orderNowTotal * orderNowVerifiedDiscount.amount) / 100 : orderNowVerifiedDiscount.amount,
          0,
        ),
        orderNowTotal,
      )
    : 0;

  const orderNowPlanDiscountAmount = hasActivePlanDiscount ? (orderNowTotal * planDiscountPercent) / 100 : 0;
  const orderNowCombinedDiscountAmount = Math.min(orderNowDiscountAmount + orderNowPlanDiscountAmount, orderNowTotal);

  const filteredReadyNowItems = selectedProteinOrderNow
    ? readyNowItems.filter((item) => item.protein === selectedProteinOrderNow)
    : readyNowItems;

  if (orderNowResult) {
    return <OrderResultView
      lang={lang}
      orderNowResult={orderNowResult}
      setOrderNowResult={setOrderNowResult}
      setOrderNowName={setOrderNowName}
      setOrderNowPhone={setOrderNowPhone}
      setOrderNowAddress={setOrderNowAddress}
      setOrderNowNotes={setOrderNowNotes}
      setOrderNowProvince={setOrderNowProvince}
      setOrderNowWard={setOrderNowWard}
      setOrderNowStreet={setOrderNowStreet}
      setOrderNowDiscountCode={setOrderNowDiscountCode}
      setOrderNowAgreeTerms={setOrderNowAgreeTerms}
      t={t}
      formatVND={formatVND}
    />;
  }

  return (
    <div>
      <div className="text-center max-w-2xl mx-auto mb-6 space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight font-heading">{t("order_title", lang)}</h2>
        <p className="text-sm text-muted-foreground">{t("order_subtitle", lang)}</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-muted/40 border border-border/40 rounded-xl">
          <button
            type="button"
            onClick={() => readyNowItems.length > 0 && setOrderFlowType("standard")}
            disabled={readyNowItems.length === 0}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              orderFlowType === "standard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
            {lang === "vi" ? "Giao Ngay (Hôm nay)" : "Order Today's Menu"}
          </button>
          <button
            type="button"
            onClick={() => setOrderFlowType("custom")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              orderFlowType === "custom"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-secondary hover:text-foreground"
            }`}
          >
            <FontAwesomeIcon icon={faMagic} className="h-3.5 w-3.5" />
            {lang === "vi" ? "Đặt Theo Yêu Cầu (Custom)" : "Custom Order Request"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-left">
          {orderFlowType === "standard" ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-4 bg-muted/20 p-2 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setSelectedProteinOrderNow("")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedProteinOrderNow === ""
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("filter_all", lang)}
                </button>
                {["BEEF", "CHICKEN", "SHRIMP"].map((protein) => {
                  const hasItems = readyNowItems.some((m) => m.protein === protein);
                  if (!hasItems) return null;
                  return (
                    <button
                      key={protein}
                      type="button"
                      onClick={() => setSelectedProteinOrderNow(protein as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedProteinOrderNow === protein
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t(`filter_${protein}` as keyof Dictionary, lang)}
                    </button>
                  );
                })}
              </div>

              {isLoadingMenu ? (
                <div className="flex justify-center py-16">
                  <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredReadyNowItems.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    {lang === "vi"
                      ? "Bếp đang chuẩn bị mẻ mới — chưa có món giao ngay. Quay lại sau ít phút nhé."
                      : "Kitchen's between batches — nothing ready to deliver now. Check back in a few minutes."}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {groupByFlavor(filteredReadyNowItems).map((dish) => {
                    const dishKey = `${dish.protein}::${dish.flavor}`;
                    const selected = getSelectedSize(dish, selectedSizeByDish);
                    const inCart = orderNowCart.find((l) => l.menuItem.id === selected.id);
                    return (
                      <div key={dishKey} className="border border-border bg-card rounded-xl p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-bold font-heading truncate">{dish.flavor}</h4>
                            <span className="text-xs font-bold text-primary shrink-0">{formatVND(selected.price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{selected.description}</p>
                        </div>

                        <div className="space-y-3 pt-2">
                          {dish.sizes.length > 1 && (
                            <div className="flex gap-1.5">
                              {dish.sizes.map((size) => (
                                <button
                                  key={size.id}
                                  type="button"
                                  onClick={() => setSelectedSizeByDish((prev) => ({ ...prev, [dishKey]: size.id }))}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                                    selected.id === size.id
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "bg-muted/40 border-border hover:bg-muted"
                                  }`}
                                >
                                  {size.sizeGrams}g
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {selected.stockQuantity} {t("unit_stock", lang)}
                            </span>
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateOrderNowQty(selected.id, inCart.qty - 1)}
                                  className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer"
                                >
                                  <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateOrderNowQty(selected.id, inCart.qty + 1)}
                                  disabled={inCart.qty >= selected.stockQuantity}
                                  className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer disabled:opacity-30"
                                >
                                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToOrderNowCart(selected)}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                              >
                                {lang === "vi" ? "Thêm" : "Add"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex gap-3 bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl text-amber-800 text-xs mb-6 text-left">
                <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{lang === "vi" ? "Lưu ý Đặt Món Theo Yêu Cầu (24h trước)" : "Custom Order Requirement (24h in advance)"}</p>
                  <p className="mt-0.5 opacity-90 leading-relaxed text-[11px]">
                    {lang === "vi"
                      ? "Món ăn đặt ngoài thực đơn có sẵn cần tối thiểu 24 giờ chuẩn bị để đảm bảo nguyên liệu tươi sống được tuyển chọn và tẩm ướp chuẩn kỹ nghệ sous-vide."
                      : "Custom orders outside our standard list require at least 24 hours of preparation to guarantee the finest fresh ingredients and perfect sous-vide marination."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "1. Chọn Nguồn Đạm (Protein)" : "1. Select Protein"}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PROTEIN_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustomOrderProtein(opt.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customOrderProtein === opt.id
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-xs font-bold font-heading">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "1.5 Chọn Định Lượng (Portion)" : "1.5 Select Portion"}</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomOrderSize(150)}
                      className={`px-6 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        customOrderSize === 150
                          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      150g
                    </button>
                    <button
                      type="button"
                      disabled={customOrderProtein !== "chicken"}
                      onClick={() => setCustomOrderSize(250)}
                      className={`px-6 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        customOrderSize === 250
                          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      250g {customOrderProtein !== "chicken" && (lang === "vi" ? "(Chỉ có cho Gà)" : "(Chicken only)")}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "2. Chọn Tinh Bột (Carbohydrates)" : "2. Select Carbohydrates"}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {CARB_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustomOrderCarb(opt.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customOrderCarb === opt.id
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-xs font-bold font-heading">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "3. Chọn Rau Củ & Toppings" : "3. Select Sides & Toppings"}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TOPPING_OPTIONS.map((opt) => {
                      const isSelected = customOrderToppings.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setCustomOrderToppings((prev) =>
                              isSelected ? prev.filter((t) => t !== opt.id) : [...prev, opt.id]
                            );
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <span className="text-xs font-bold font-heading">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "4. Chọn Xốt" : "4. Select Sauce"}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SAUCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustomOrderSauce(opt.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customOrderSauce === opt.id
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-xs font-bold font-heading">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Thời gian giao hàng (Dự kiến)" : "Delivery Date (Scheduled)"}</label>
                    <input
                      type="date"
                      required
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      value={customOrderDeliveryDate}
                      onChange={(e) => setCustomOrderDeliveryDate(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground cursor-pointer font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Số lượng phần ăn" : "Quantity"}</label>
                    <div className="flex items-center gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setCustomOrderQty((prev) => Math.max(1, prev - 1))}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-extrabold w-8 text-center font-mono">{customOrderQty}</span>
                      <button
                        type="button"
                        onClick={() => setCustomOrderQty((prev) => prev + 1)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {orderFlowType === "standard" ? (
            <div className="border border-border bg-card rounded-2xl p-6 space-y-4 shadow-sm text-left">
              <h3 className="text-sm font-bold font-heading">{t("txt_your_order", lang)}</h3>
              {orderNowCart.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("txt_empty_cart", lang)}</p>
              ) : (
                <div className="space-y-2">
                  {orderNowCart.map((l) => (
                    <div key={l.menuItem.id} className="flex justify-between text-xs">
                      <span className="truncate pr-2">{l.menuItem.flavor} ×{l.qty}</span>
                      <span className="font-semibold shrink-0">{formatVND(l.menuItem.price * l.qty)}</span>
                    </div>
                  ))}
                  {hasActivePlanDiscount && (
                    <div className="flex justify-between text-xs font-semibold text-emerald-600 pt-1 border-t border-border/50">
                      <span>{lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}</span>
                      <span>-{formatVND(orderNowPlanDiscountAmount)}</span>
                    </div>
                  )}
                  {orderNowDiscountAmount > 0 && (
                    <div className={`flex justify-between text-xs font-semibold text-emerald-600 ${hasActivePlanDiscount ? "" : "pt-1 border-t border-border/50"}`}>
                      <span>{lang === "vi" ? "Mã giảm giá" : "Discount code"}</span>
                      <span>-{formatVND(orderNowDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-border/50">
                    <span>{t("cart_total", lang)}</span>
                    <span className="text-primary">{formatVND(orderNowTotal - orderNowCombinedDiscountAmount + 30000)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">+ 30,000 ₫ phí giao hàng</div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-border bg-card rounded-2xl p-6 space-y-4 shadow-sm text-left">
              <h3 className="text-sm font-bold font-heading">{lang === "vi" ? "Thành phần & Giá" : "Composition & Price"}</h3>
              <div className="space-y-1 font-mono text-xs text-secondary">
                <div className="flex justify-between items-center"><span className="tracking-wider">PROTEIN</span><span className="font-bold text-foreground">{customOrderProtein} {customOrderSize}g</span></div>
                <div className="flex justify-between items-center"><span className="tracking-wider">CARB</span><span className="font-bold text-foreground">{CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.label.split(" (")[0] || ""}</span></div>
                <div className="flex justify-between items-center"><span className="tracking-wider">TOPPINGS</span><span className="font-bold text-foreground">{customOrderToppings.length > 0 ? customOrderToppings.join(", ") : "None"}</span></div>
                <div className="flex justify-between items-center"><span className="tracking-wider">SAUCE</span><span className="font-bold text-foreground">{SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.label.split(" (")[0] || ""}</span></div>
                <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2"><span className="tracking-wider font-bold">CALORIES</span><span className="font-bold text-primary text-base">{calculateCustomOrderPrice(customOrderProtein, customOrderSize, customOrderCarb, customOrderSauce, customOrderToppings)} kcal</span></div>
                <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2"><span className="tracking-wider font-bold">{lang === "vi" ? "GIÁ TIỀN" : "PRICE"}</span><span className="font-bold text-foreground text-sm">{formatVND(calculateCustomOrderPrice(customOrderProtein, customOrderSize, customOrderCarb, customOrderSauce, customOrderToppings) * customOrderQty)}</span></div>
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                {lang === "vi" ? "Tiếp tục thanh toán" : "Proceed to Checkout"}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitOrderNow} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_coupon", lang)}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("cart_coupon", lang)}
                value={orderNowDiscountCode}
                onChange={(e) => setOrderNowDiscountCode(e.target.value)}
                className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none uppercase"
              />
              <button
                type="button"
                disabled={orderNowDiscountCodeStatus === "checking"}
                className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {orderNowDiscountCodeStatus === "checking"
                  ? "⋯"
                  : orderNowDiscountCodeStatus === "valid"
                  ? "✓"
                  : t("cart_apply", lang)}
              </button>
            </div>
            {orderNowDiscountCodeError && <p className="text-[10px] text-red-500">{orderNowDiscountCodeError}</p>}
            {orderNowVerifiedDiscount && orderNowDiscountCodeStatus === "valid" && (
              <p className="text-[10px] text-emerald-600 font-semibold">
                {orderNowVerifiedDiscount.type === "PERCENTAGE"
                  ? `${orderNowVerifiedDiscount.amount}% off`
                  : `${orderNowVerifiedDiscount.amount.toLocaleString()} ₫ off`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_address", lang)}</label>
            <div className="space-y-2">
              <select
                value={orderNowProvince}
                onChange={(e) => setOrderNowProvince(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none cursor-pointer font-bold font-mono"
              >
                <option value="">{t("cart_province", lang)}</option>
                <option value="79">TP. Hồ Chí Minh</option>
              </select>
              <input
                type="text"
                placeholder={t("cart_street", lang)}
                value={orderNowStreet}
                onChange={(e) => setOrderNowStreet(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_notes", lang)}</label>
            <textarea
              value={orderNowNotes}
              onChange={(e) => setOrderNowNotes(e.target.value)}
              rows={2}
              className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
              placeholder={t("placeholder_notes", lang)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("cart_payment", lang)}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrderNowPaymentMethod("CASH_ON_DELIVERY")}
                className={`flex-1 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                  orderNowPaymentMethod === "CASH_ON_DELIVERY"
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {t("cart_cod", lang)}
              </button>
              <button
                type="button"
                onClick={() => setOrderNowPaymentMethod("BANK_TRANSFER")}
                className={`flex-1 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                  orderNowPaymentMethod === "BANK_TRANSFER"
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {t("cart_vietqr", lang)}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="orderNowAgreeTerms"
              checked={orderNowAgreeTerms}
              onChange={(e) => setOrderNowAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              required
            />
            <label htmlFor="orderNowAgreeTerms" className="text-xs text-muted-foreground cursor-pointer">
              {t("cart_agree", lang)} <a href="#" className="text-primary hover:underline">{t("cart_terms", lang)}</a>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOrderNowName("");
                setOrderNowPhone("");
                setOrderNowAddress("");
                setOrderNowNotes("");
                setOrderNowProvince("");
                setOrderNowWard("");
                setOrderNowStreet("");
                setOrderNowDiscountCode("");
                setOrderNowAgreeTerms(false);
                setOrderFlowType("standard");
              }}
              className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
            >
              {lang === "vi" ? "Quay lại" : "Back"}
            </button>
            <button
              type="submit"
              disabled={isSubmittingOrderNow}
              className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmittingOrderNow
                ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                : t("btn_checkout", lang)}
            </button>
          </div>

          {orderNowError && <p className="text-xs text-red-500 text-center">{orderNowError}</p>}
        </form>
    </div>
  </div>
  );
}

function formatVND(num: number): string {
  return `${num.toLocaleString()} ₫`;
}
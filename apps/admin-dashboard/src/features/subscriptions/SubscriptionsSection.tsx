'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faCheck, faTimes, faChevronDown, faChevronUp, faBox, faTruck, faCalendarAlt, faUtensils, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, formatGrams, formatVND, formatIntervalLabel, ORDER_STATUS_LABELS, PAYMENT_STATE_OPTIONS, DELIVERY_AMOUNT_PRESETS_GRAMS, DELIVERY_FREQUENCY_PRESETS, calculatePoolPricing } from '@fortifykitchen/shared';
import type { Protein, PaymentState } from '@fortifykitchen/types';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const CARD_PAGE_SIZE = 8;

interface Props {
  token: string | null;
  API_URL: string;
  subscriptions: any[];
  customers: any[];
  menuItems: any[];
  lang: 'vi' | 'en';
  section: string;
  setSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function SubscriptionsSection({
  token,
  API_URL,
  subscriptions,
  customers,
  menuItems,
  lang,
  section,
  setSubscriptions,
  setCustomers,
  setMenuItems,
  loadData,
  handleUnauthorized,
  checkOffline,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [subModal, setSubModal] = React.useState<'create' | null>(null);
  const [subLinkedCustomPlanRequestId, setSubLinkedCustomPlanRequestId] = React.useState<string | null>(null);
  const [subDetailId, setSubDetailId] = React.useState<string | null>(null);
  const [subDetailDeliveries, setSubDetailDeliveries] = React.useState<any[]>([]);
  const [isSubDetailLoading, setIsSubDetailLoading] = React.useState(false);
  const [topUpModal, setTopUpModal] = React.useState<{ subId: string; protein: Protein; grams: number } | null>(null);
  const [processingTopUpId, setProcessingTopUpId] = React.useState<string | null>(null);
  const [subscriptionsPage, setSubscriptionsPage] = React.useState(1);

  const [subCustomerId, setSubCustomerId] = React.useState('');
  const [subPackageName, setSubPackageName] = React.useState('');
  const [subPools, setSubPools] = React.useState<{ protein: Protein; sizeGrams: number; qty: number }[]>([]);
  const [subPoolProtein, setSubPoolProtein] = React.useState<Protein>('CHICKEN');
  const [subPoolSizeGrams, setSubPoolSizeGrams] = React.useState(150);
  const [subPoolQty, setSubPoolQty] = React.useState(10);
  const [subDeliveryAmountGrams, setSubDeliveryAmountGrams] = React.useState(1000);
  const [subDeliveryIntervalDays, setSubDeliveryIntervalDays] = React.useState(1);
  const [subStartDate, setSubStartDate] = React.useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [subPaymentStatus, setSubPaymentStatus] = React.useState<PaymentState>('UNPAID');

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const subPoolAvailableSizes = Array.from(
    new Set(
      menuItems
        .filter((m) => m.isAvailable && m.protein === subPoolProtein)
        .map((m) => m.sizeGrams as number),
    ),
  ).sort((a, b) => a - b);

  const addSubPool = () => {
    if (subPoolQty <= 0 || !subPoolSizeGrams) return;
    setSubPools((prev) => {
      const existing = prev.find((p) => p.protein === subPoolProtein && p.sizeGrams === subPoolSizeGrams);
      if (existing) {
        return prev.map((p) =>
          p.protein === subPoolProtein && p.sizeGrams === subPoolSizeGrams
            ? { ...p, qty: p.qty + subPoolQty }
            : p,
        );
      }
      return [...prev, { protein: subPoolProtein, sizeGrams: subPoolSizeGrams, qty: subPoolQty }];
    });
    setSubPoolQty(10);
  };

  const subTotalGrams = subPools.reduce((sum, p) => sum + p.sizeGrams * p.qty, 0);
  const subSchedulePreview =
    subTotalGrams > 0 && subDeliveryAmountGrams > 0 && subDeliveryIntervalDays > 0
      ? generateVolumeSchedule(subStartDate, subDeliveryAmountGrams, subDeliveryIntervalDays, subTotalGrams)
      : [];
  const subPricing =
    subPools.length > 0
      ? calculatePoolPricing(
          subPools.map((p) => ({ protein: p.protein, sizeGrams: p.sizeGrams, qty: p.qty })),
          menuItems.filter((m) => m.isAvailable),
        )
      : null;

  const resetSubForm = () => {
    setSubCustomerId('');
    setSubPackageName('');
    setSubPools([]);
    setSubPoolProtein('CHICKEN');
    setSubPoolSizeGrams(150);
    setSubPoolQty(10);
    setSubDeliveryAmountGrams(1000);
    setSubDeliveryIntervalDays(1);
    setSubStartDate(new Date().toISOString().split('T')[0]);
    setSubPaymentStatus('UNPAID');
    setSubLinkedCustomPlanRequestId(null);
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCustomerId) { toast({ title: 'Vui lòng chọn khách hàng', type: 'error' }); return; }
    if (!subPackageName.trim()) { toast({ title: 'Vui lòng nhập tên gói', type: 'error' }); return; }
    if (subPools.length === 0) { toast({ title: 'Vui lòng thêm ít nhất 1 loại protein', type: 'error' }); return; }
    try {
      const poolsByProtein = new Map<Protein, { sizeGrams: number; qty: number }[]>();
      for (const p of subPools) {
        const list = poolsByProtein.get(p.protein) ?? [];
        list.push({ sizeGrams: p.sizeGrams, qty: p.qty });
        poolsByProtein.set(p.protein, list);
      }
      const payload = {
        customerId: subCustomerId,
        packageName: subPackageName,
        pools: Array.from(poolsByProtein.entries()).map(([protein, portions]) => ({ protein, portions })),
        deliveryAmountGrams: subDeliveryAmountGrams,
        deliveryIntervalDays: subDeliveryIntervalDays,
        startDate: subStartDate,
        paymentStatus: subPaymentStatus,
        ...(subLinkedCustomPlanRequestId ? { customPlanRequestId: subLinkedCustomPlanRequestId } : {}),
      };
      const res = await fetch(`${API_URL}/subscriptions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setSubModal(null);
        resetSubForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to create subscription', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubStatus = async (subId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/subscriptions/${subId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubscription = (subId: string) => {
    requestConfirm(
      'Xóa gói đăng ký này? Toàn bộ lịch giao hàng sẽ bị xóa.',
      async () => {
        try {
          const res = await fetch(`${API_URL}/subscriptions/${subId}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const handleOpenSubDetail = async (subId: string) => {
    setSubDetailId(subId);
    setIsSubDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/subscription/${subId}`, { headers: authHeaders() });
      if (res.ok) setSubDetailDeliveries((await res.json()).data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubDetailLoading(false);
    }
  };

  const handleTopUpPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpModal) return;
    try {
      const res = await fetch(`${API_URL}/subscriptions/${topUpModal.subId}/top-up`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ protein: topUpModal.protein, grams: Math.round(topUpModal.grams) }),
      });
      if (res.ok) {
        setTopUpModal(null);
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to top up pool', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const subscriptionsTotalPages = Math.ceil(subscriptions.length / CARD_PAGE_SIZE) || 1;
  const subscriptionsSafePage = clampPage(subscriptionsPage, subscriptionsTotalPages);
  const pagedSubscriptions = paginate(subscriptions, subscriptionsSafePage, CARD_PAGE_SIZE);

  if (section !== 'subscriptions') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-bold font-heading">Subscriptions ({subscriptions.length})</h3>
        <button
          onClick={() => { resetSubForm(); setSubModal('create'); }}
          className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Tạo gói đăng ký
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pagedSubscriptions.map((sub) => {
          const totalRemaining = (sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0);
          const totalPurchased = (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 0);
          const pct = totalPurchased > 0 ? Math.round((totalRemaining / totalPurchased) * 100) : 0;
          return (
            <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold font-heading truncate">{sub.packageName}</h4>
                  <p className="text-xs text-muted-foreground truncate">{sub.customerName || 'Customer'}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    sub.status === 'ACTIVE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : sub.status === 'COMPLETED'
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {sub.status}
                </span>
              </div>

              <div className="space-y-2">
                {(sub.pools || []).map((p: any) => {
                  const poolPct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold">{PROTEIN_LABELS[p.protein as Protein] || p.protein}</span>
                        <span className=" text-muted-foreground">
                          {formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} còn lại
                        </span>
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
                <div className="text-right">
                  {sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${pct}% còn lại`}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                <button
                  onClick={() => handleOpenSubDetail(sub.id)}
                  className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer"
                >
                  Chi tiết
                </button>
                <button
                  onClick={() => setTopUpModal({ subId: sub.id, protein: sub.pools?.[0]?.protein || 'CHICKEN', grams: 5000 })}
                  className="flex-1 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-bold rounded-md cursor-pointer"
                >
                  Mua thêm
                </button>
                <button
                  onClick={() => handleUpdateSubStatus(sub.id, sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                  className="py-1.5 px-3 border border-border bg-background hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer"
                >
                  {sub.status === 'ACTIVE' ? 'Tạm dừng' : 'Tiếp tục'}
                </button>
                <button
                  onClick={() => handleDeleteSubscription(sub.id)}
                  className="py-1.5 px-2 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {subscriptions.length === 0 && (
          <div className="lg:col-span-2 border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
            Chưa có gói đăng ký nào
          </div>
        )}
      </div>
      <PaginationControls
        page={subscriptionsSafePage}
        totalPages={subscriptionsTotalPages}
        totalItems={subscriptions.length}
        pageSize={CARD_PAGE_SIZE}
        onChange={setSubscriptionsPage}
      />

      {subModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => { setSubModal(null); resetSubForm(); }} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">Tạo gói đăng ký</h3>
              {subLinkedCustomPlanRequestId && (
                <p className="text-[11px] text-primary font-semibold mt-1">
                  Đang tạo từ yêu cầu tư vấn gói riêng — sẽ tự động đánh dấu "Đã ghép gói" khi lưu
                </p>
              )}
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khách hàng</label>
                  <select
                    required
                    value={subCustomerId}
                    onChange={(e) => setSubCustomerId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên gói</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gói tăng cơ 30 ngày"
                    value={subPackageName}
                    onChange={(e) => setSubPackageName(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mua theo số phần ăn (portion)
                </label>
                <div className="flex gap-2">
                  <select
                    value={subPoolProtein}
                    onChange={(e) => {
                      const protein = e.target.value as Protein;
                      setSubPoolProtein(protein);
                      const sizes = Array.from(
                        new Set(
                          menuItems
                            .filter((m) => m.isAvailable && m.protein === protein)
                            .map((m) => m.sizeGrams as number),
                        ),
                      ).sort((a, b) => a - b);
                      if (sizes.length > 0 && !sizes.includes(subPoolSizeGrams)) {
                        setSubPoolSizeGrams(sizes[0]);
                      }
                    }}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {['CHICKEN', 'BEEF', 'SHRIMP'].map((p) => (
                      <option key={p} value={p}>{PROTEIN_LABELS[p as Protein]}</option>
                    ))}
                  </select>
                  <select
                    value={subPoolSizeGrams}
                    onChange={(e) => setSubPoolSizeGrams(Number(e.target.value))}
                    className="w-28 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {subPoolAvailableSizes.length === 0 && <option value={subPoolSizeGrams}>{subPoolSizeGrams}g</option>}
                    {subPoolAvailableSizes.map((sz) => (
                      <option key={sz} value={sz}>{sz}g</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={subPoolQty}
                    onChange={(e) => setSubPoolQty(Number(e.target.value))}
                    placeholder="Số phần"
                    className="w-20 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSubPool}
                    className="bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold px-4 rounded-lg border border-border cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
                {subPoolAvailableSizes.length === 0 && (
                  <p className="text-[11px] text-red-500">
                    Chưa có món khả dụng cho {PROTEIN_LABELS[subPoolProtein]} — vui lòng thêm món trong Thực đơn trước.
                  </p>
                )}

                {subPools.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {subPools.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span>{PROTEIN_LABELS[p.protein]} — {p.qty} phần x {p.sizeGrams}g</span>
                        <button
                          type="button"
                          onClick={() => setSubPools((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {subPricing && subPricing.missingCombos.length > 0 && (
                  <p className="text-[11px] text-red-500">
                    Chưa có món khả dụng cho: {subPricing.missingCombos.join(', ')}
                  </p>
                )}
                {subPricing && subPricing.missingCombos.length === 0 && subPools.length > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm tính ({(subTotalGrams / 1000).toFixed(1)}kg)</span>
                      <span>{formatVND(subPricing.lineSubtotal)}</span>
                    </div>
                    {subPricing.orderDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Giảm giá trọn gói</span>
                        <span>-{formatVND(subPricing.orderDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-primary text-sm pt-1">
                      <span>Tổng giá gói</span>
                      <span>{formatVND(subPricing.finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mỗi lần giao</label>
                  <select
                    value={subDeliveryAmountGrams}
                    onChange={(e) => setSubDeliveryAmountGrams(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {DELIVERY_AMOUNT_PRESETS_GRAMS.map((g) => (
                      <option key={g} value={g}>{formatGrams(g)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tần suất giao</label>
                  <select
                    value={subDeliveryIntervalDays}
                    onChange={(e) => setSubDeliveryIntervalDays(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {DELIVERY_FREQUENCY_PRESETS.map((p) => (
                      <option key={p.days} value={p.days}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={subStartDate}
                    onChange={(e) => setSubStartDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              {subSchedulePreview.length > 0 && (
                <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Lịch giao dự kiến: <span className="font-bold text-foreground">{subSchedulePreview.length}</span> lần giao,
                  mỗi {formatIntervalLabel(subDeliveryIntervalDays)} — kết thúc khoảng{" "}
                  <span className="font-bold text-foreground">
                    {new Date(subSchedulePreview[subSchedulePreview.length - 1].date).toLocaleDateString('vi-VN')}
                  </span>
                  . Chỉ 7 ngày đầu được tạo lịch giao ngay, phần còn lại tự động bổ sung dần.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái thanh toán</label>
                <select
                  value={subPaymentStatus}
                  onChange={(e) => setSubPaymentStatus(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSubModal(null); resetSubForm(); }}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Tạo gói đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subDetailId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSubDetailId(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading">Lịch sử giao hàng</h3>
              <button onClick={() => setSubDetailId(null)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Đóng
              </button>
            </div>
            {isSubDetailLoading ? (
              <div className="py-10 text-center"><FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
            ) : subDetailDeliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Chưa có lần giao nào được tạo</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {subDetailDeliveries.map((d: any) => (
                  <div key={d.id} className="border border-border rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{new Date(d.deliveryDate).toLocaleDateString('vi-VN')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-muted">{ORDER_STATUS_LABELS[d.status as import('@fortifykitchen/types').OrderStatus] || d.status}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {d.items.map((i: any) => `${PROTEIN_LABELS[i.protein as Protein] || i.protein} ${i.flavor} (${i.sizeGrams}g) ×${i.qty}`).join(', ')}
                    </div>
                    {d.notes && <div className="text-[10px] text-muted-foreground whitespace-pre-line">{d.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {topUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setTopUpModal(null)} />
          <div className="relative w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-sm font-bold font-heading">Mua thêm khối lượng</h3>
            <form onSubmit={handleTopUpPool} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protein</label>
                <select
                  value={topUpModal.protein}
                  onChange={(e) => setTopUpModal({ ...topUpModal, protein: e.target.value as Protein })}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {['CHICKEN', 'BEEF', 'SHRIMP'].map((p) => (
                    <option key={p} value={p}>{PROTEIN_LABELS[p as Protein]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thêm bao nhiêu kg</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={topUpModal.grams / 1000}
                  onChange={(e) => setTopUpModal({ ...topUpModal, grams: Number(e.target.value) * 1000 })}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={processingTopUpId === topUpModal.subId}
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function generateVolumeSchedule(
  startDate: Date | string,
  deliveryAmountGrams: number,
  deliveryIntervalDays: number,
  totalGrams: number,
) {
  if (!deliveryAmountGrams || deliveryAmountGrams <= 0 || !deliveryIntervalDays || deliveryIntervalDays <= 0 || !totalGrams || totalGrams <= 0) {
    return [];
  }

  const entries: { index: number; date: string; grams: number }[] = [];
  const start = new Date(startDate);
  let remaining = totalGrams;
  let i = 0;
  const MAX_ENTRIES = 2000;

  while (remaining > 0 && i < MAX_ENTRIES) {
    const grams = Math.min(deliveryAmountGrams, remaining);
    const d = new Date(start);
    d.setDate(d.getDate() + i * deliveryIntervalDays);
    entries.push({ index: i, date: d.toISOString().split('T')[0], grams });
    remaining -= grams;
    i += 1;
  }

  return entries;
}
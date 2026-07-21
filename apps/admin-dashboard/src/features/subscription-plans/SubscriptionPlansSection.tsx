'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCheck, faTimes, faPlus, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { formatVND } from '@fortifykitchen/shared';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  token: string | null;
  API_URL: string;
  subscriptionPlans: any[];
  pendingTopUps: any[];
  lang: 'vi' | 'en';
  section: string;
  setSubscriptionPlans: React.Dispatch<React.SetStateAction<any[]>>;
  setPendingTopUps: React.Dispatch<React.SetStateAction<any[]>>;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function SubscriptionPlansSection({
  token,
  API_URL,
  subscriptionPlans,
  pendingTopUps,
  lang: _lang,
  section,
  setSubscriptionPlans: _setSubscriptionPlans,
  setPendingTopUps: _setPendingTopUps,
  loadData,
  handleUnauthorized: _handleUnauthorized,
  checkOffline: _checkOffline,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [editingSubPlanId, setEditingSubPlanId] = React.useState<string | null>(null);
  const [subPlanName, setSubPlanName] = React.useState('');
  const [subPlanPrice, setSubPlanPrice] = React.useState(1500000);
  const [subPlanVoucherPercent, setSubPlanVoucherPercent] = React.useState(5);
  const [subPlanDescription, setSubPlanDescription] = React.useState('');
  const [subPlanFeatures, setSubPlanFeatures] = React.useState<string[]>([]);
  const [subPlanIsActive, setSubPlanIsActive] = React.useState(true);
  const [isSavingSubPlan, setIsSavingSubPlan] = React.useState(false);

  const [subscriptionPlansPage, setSubscriptionPlansPage] = React.useState(1);
  const [pendingTopUpsPage, setPendingTopUpsPage] = React.useState(1);
  const [processingTopUpId, setProcessingTopUpId] = React.useState<string | null>(null);

  // Track which plan card is expanded to show features
  const [expandedPlanId, setExpandedPlanId] = React.useState<string | null>(null);

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleEditSubPlanTrigger = (p: any) => {
    setEditingSubPlanId(p.id);
    setSubPlanName(p.name);
    setSubPlanPrice(p.price);
    setSubPlanVoucherPercent(p.voucherPercent);
    setSubPlanDescription(p.description || '');
    setSubPlanFeatures(p.features || []);
    setSubPlanIsActive(p.isActive);
  };

  const resetSubPlanForm = () => {
    setEditingSubPlanId(null);
    setSubPlanName('');
    setSubPlanPrice(1500000);
    setSubPlanVoucherPercent(5);
    setSubPlanDescription('');
    setSubPlanFeatures([]);
    setSubPlanIsActive(true);
  };

  // --- Features list helpers ---
  const addFeature = () => {
    setSubPlanFeatures([...subPlanFeatures, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...subPlanFeatures];
    updated[index] = value;
    setSubPlanFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setSubPlanFeatures(subPlanFeatures.filter((_, i) => i !== index));
  };

  const handleSaveSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSubPlan(true);
    try {
      // Filter out empty feature strings before saving
      const cleanedFeatures = subPlanFeatures.filter((f) => f.trim() !== '');
      const payload = {
        name: subPlanName,
        price: subPlanPrice,
        voucherPercent: subPlanVoucherPercent,
        description: subPlanDescription || undefined,
        features: cleanedFeatures,
        isActive: subPlanIsActive,
      };
      const url = editingSubPlanId ? `${API_URL}/subscription-plans/${editingSubPlanId}` : `${API_URL}/subscription-plans`;
      const method = editingSubPlanId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        resetSubPlanForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to save plan', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSubPlan(false);
    }
  };

  const handleDeleteSubscriptionPlan = (id: string) => {
    requestConfirm(
      'Xóa gói nạp này?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/subscription-plans/${id}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const handleConfirmTopUp = async (id: string) => {
    setProcessingTopUpId(id);
    try {
      const res = await fetch(`${API_URL}/subscription-plan-purchases/${id}/confirm`, { method: 'POST', headers: authHeaders() });
      if (res.ok) loadData();
      else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to confirm top-up', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingTopUpId(null);
    }
  };

  const handleRejectTopUp = async (id: string) => {
    setProcessingTopUpId(id);
    try {
      const res = await fetch(`${API_URL}/subscription-plan-purchases/${id}/reject`, { method: 'POST', headers: authHeaders() });
      if (res.ok) loadData();
      else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to reject top-up', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingTopUpId(null);
    }
  };

  const subscriptionPlansTotalPages = Math.ceil(subscriptionPlans.length / PAGE_SIZE) || 1;
  const subscriptionPlansSafePage = clampPage(subscriptionPlansPage, subscriptionPlansTotalPages);
  const pagedSubscriptionPlans = paginate(subscriptionPlans, subscriptionPlansSafePage, PAGE_SIZE);

  const pendingTopUpsTotalPages = Math.ceil(pendingTopUps.length / PAGE_SIZE) || 1;
  const pendingTopUpsSafePage = clampPage(pendingTopUpsPage, pendingTopUpsTotalPages);
  const pagedPendingTopUps = paginate(pendingTopUps, pendingTopUpsSafePage, PAGE_SIZE);

  if (section !== 'subscription-plans') return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="border border-border bg-card rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold font-heading mb-4">
            {editingSubPlanId ? 'Chỉnh sửa gói nạp' : 'Tạo gói nạp mới'}
          </h3>
          <form onSubmit={handleSaveSubscriptionPlan} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên gói</label>
              <input
                type="text"
                required
                placeholder="vd: Gói 1.5 triệu"
                value={subPlanName}
                onChange={(e) => setSubPlanName(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giá (VND)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={subPlanPrice}
                  onChange={(e) => setSubPlanPrice(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={subPlanVoucherPercent}
                  onChange={(e) => setSubPlanVoucherPercent(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả (tùy chọn)</label>
              <textarea
                rows={2}
                value={subPlanDescription}
                onChange={(e) => setSubPlanDescription(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
              />
            </div>

            {/* --- Features / benefits list --- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quyền lợi / Bao gồm
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" /> Thêm mục
                </button>
              </div>
              {subPlanFeatures.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  Chưa có quyền lợi nào. Bấm &quot;Thêm mục&quot; để thêm.
                </p>
              )}
              <div className="space-y-1.5">
                {subPlanFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 group">
                    <FontAwesomeIcon icon={faGripVertical} className="h-2.5 w-2.5 text-muted-foreground/40" />
                    <input
                      type="text"
                      placeholder={`vd: Giảm ${5 + idx}% mọi đơn hàng`}
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      className="flex-1 bg-background border border-border focus:border-primary text-xs py-2 px-2.5 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={subPlanIsActive}
                onChange={(e) => setSubPlanIsActive(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer"
              />
              Đang hoạt động (hiển thị cho khách hàng)
            </label>

            <div className="flex gap-2">
              {editingSubPlanId && (
                <button
                  type="button"
                  onClick={resetSubPlanForm}
                  className="flex-1 border border-border hover:bg-muted text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                disabled={isSavingSubPlan}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingSubPlan ? 'Đang lưu...' : editingSubPlanId ? 'Lưu thay đổi' : 'Tạo gói nạp'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 border border-border bg-card rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold font-heading mb-4">Danh mục gói nạp ({subscriptionPlans.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted-foreground border-b border-border/50 pb-2">
                  <th className="pb-3 font-semibold">Tên gói</th>
                  <th className="pb-3 font-semibold">Giá</th>
                  <th className="pb-3 font-semibold">Voucher</th>
                  <th className="pb-3 font-semibold">Quyền lợi</th>
                  <th className="pb-3 font-semibold text-center">Trạng thái</th>
                  <th className="pb-3 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedSubscriptionPlans.map((p: any) => (
                  <React.Fragment key={p.id}>
                    <tr className="border-b border-border/20 last:border-0">
                      <td className="py-3.5 font-bold">{p.name}</td>
                      <td className="py-3.5 font-bold text-primary">{formatVND(p.price)}</td>
                      <td className="py-3.5 text-muted-foreground">{p.voucherPercent}%</td>
                      <td className="py-3.5">
                        {(p.features || []).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedPlanId(expandedPlanId === p.id ? null : p.id)}
                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0"
                          >
                            {p.features.length} mục {expandedPlanId === p.id ? '▲' : '▼'}
                          </button>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Chưa có</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {p.isActive ? 'Hoạt động' : 'Đã ẩn'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditSubPlanTrigger(p)}
                            className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriptionPlan(p.id)}
                            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded features row */}
                    {expandedPlanId === p.id && (p.features || []).length > 0 && (
                      <tr>
                        <td colSpan={6} className="pb-3 pt-0 px-4">
                          <div className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                              Quyền lợi bao gồm:
                            </p>
                            {(p.features || []).map((f: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-emerald-600 mt-0.5">✓</span>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {subscriptionPlans.length === 0 && (
            <div className="border border-dashed border-border rounded-lg py-12 text-center text-xs text-muted-foreground">
              Chưa có gói nạp nào
            </div>
          )}
          <PaginationControls
            page={subscriptionPlansSafePage}
            totalPages={subscriptionPlansTotalPages}
            totalItems={subscriptionPlans.length}
            pageSize={PAGE_SIZE}
            onChange={setSubscriptionPlansPage}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold font-heading">Chờ xác nhận chuyển khoản ({pendingTopUps.length})</h3>
        {pendingTopUps.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
            Không có giao dịch nạp ví nào đang chờ xác nhận
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pagedPendingTopUps.map((t: any) => (
              <div key={t.id} className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{t.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{t.planName}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200">
                    Chờ xác nhận
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-muted/30 border border-border/50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-bold text-primary">{formatVND(t.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span className="font-semibold">{new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {t.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã giao dịch:</span>
                      <span className="font-semibold">{t.transactionId}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <button
                    onClick={() => handleConfirmTopUp(t.id)}
                    disabled={processingTopUpId === t.id}
                    className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faCheck} className="h-3 w-3" /> Xác nhận
                  </button>
                  <button
                    onClick={() => handleRejectTopUp(t.id)}
                    disabled={processingTopUpId === t.id}
                    className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-3 w-3" /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationControls
          page={pendingTopUpsSafePage}
          totalPages={pendingTopUpsTotalPages}
          totalItems={pendingTopUps.length}
          pageSize={PAGE_SIZE}
          onChange={setPendingTopUpsPage}
        />
      </div>
    </div>
  );
}
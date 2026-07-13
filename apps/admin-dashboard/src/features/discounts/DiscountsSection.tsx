'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { formatVND } from '@fortifykitchen/shared';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  token: string | null;
  API_URL: string;
  discounts: any[];
  lang: 'vi' | 'en';
  section: string;
  setDiscounts: React.Dispatch<React.SetStateAction<any[]>>;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function DiscountsSection({
  token,
  API_URL,
  discounts,
  lang,
  section,
  setDiscounts,
  loadData,
  handleUnauthorized,
  checkOffline,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [discountCode, setDiscountCode] = React.useState('');
  const [discountType, setDiscountType] = React.useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountAmount, setDiscountAmount] = React.useState(10);
  const [discountStarts, setDiscountStarts] = React.useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [discountEnds, setDiscountEnds] = React.useState(() => {
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    return end.toISOString().slice(0, 16);
  });
  const [discountsPage, setDiscountsPage] = React.useState(1);

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: discountCode.toUpperCase(),
        type: discountType,
        amount: discountAmount,
        startsAt: new Date(discountStarts).toISOString(),
        endsAt: new Date(discountEnds).toISOString(),
      };
      const res = await fetch(`${API_URL}/discounts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDiscountCode('');
        setDiscountAmount(10);
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to create discount', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = (id: string) => {
    requestConfirm(
      'Xóa mã khuyến mãi này?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/discounts/${id}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const discountsTotalPages = Math.ceil(discounts.length / PAGE_SIZE) || 1;
  const discountsSafePage = clampPage(discountsPage, discountsTotalPages);
  const pagedDiscounts = paginate(discounts, discountsSafePage, PAGE_SIZE);

  if (section !== 'discounts') return null;

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm h-fit">
        <h3 className="text-sm font-bold font-heading mb-4">Generate Promo Code</h3>
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Promo Code</label>
            <input
              type="text"
              required
              placeholder="e.g. FORTIFY20"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code Type</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (VND)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discount Amount</label>
              <input
                type="number"
                required
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
              <input
                type="datetime-local"
                required
                value={discountStarts}
                onChange={(e) => setDiscountStarts(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date</label>
              <input
                type="datetime-local"
                required
                value={discountEnds}
                onChange={(e) => setDiscountEnds(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer"
          >
            Generate Code
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 border border-border bg-card rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold font-heading mb-4">Active Promo Codes catalog</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50 pb-2">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Value</th>
                <th className="pb-3 font-semibold">Valid Period</th>
                <th className="pb-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedDiscounts.map((d) => (
                <tr key={d.id} className="border-b border-border/20 last:border-0">
                  <td className="py-3.5 font-bold tracking-wider">{d.code}</td>
                  <td className="py-3.5 text-muted-foreground">{d.type}</td>
                  <td className="py-3.5 font-bold text-primary">
                    {d.type === 'PERCENTAGE' ? `${d.amount} %` : formatVND(d.amount)}
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    {new Date(d.startsAt).toLocaleDateString('vi-VN')} - {new Date(d.endsAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => handleDeleteDiscount(d.id)}
                      className="text-red-500 hover:text-red-600 p-1.5 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={discountsSafePage}
          totalPages={discountsTotalPages}
          totalItems={discounts.length}
          pageSize={PAGE_SIZE}
          onChange={setDiscountsPage}
        />
      </div>
    </div>
  );
}
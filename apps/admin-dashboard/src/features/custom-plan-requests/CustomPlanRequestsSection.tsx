'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, formatGrams, formatVND, formatIntervalLabel } from '@fortifykitchen/shared';
import { CUSTOM_PLAN_REQUEST_STATUS_OPTIONS, CUSTOM_PLAN_REQUEST_STATUS_LABELS, CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS } from '@/constants/custom-plan-status';
import type { Protein, CustomPlanRequestStatus } from '@fortifykitchen/types';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  token: string | null;
  API_URL: string;
  customPlanRequests: any[];
  lang: 'vi' | 'en';
  section: string;
  loadData: () => void;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function CustomPlanRequestsSection({
  token,
  API_URL,
  customPlanRequests,
  lang,
  section,
  loadData,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [cprStatusFilter, setCprStatusFilter] = React.useState<'ALL' | CustomPlanRequestStatus>('ALL');
  const [customPlanRequestsPage, setCustomPlanRequestsPage] = React.useState(1);
  const [cprNoteDrafts, setCprNoteDrafts] = React.useState<Record<string, string>>({});

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleUpdateCustomPlanRequest = async (id: string, updates: { status?: string; adminNotes?: string }) => {
    try {
      const res = await fetch(`${API_URL}/custom-plan-requests/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) loadData();
      else {
        const error = await res.json().catch(() => null);
        toast({ title: error?.message || 'Failed to update request', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomPlanRequest = (id: string) => {
    requestConfirm(
      'Xóa yêu cầu tư vấn gói riêng này?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/custom-plan-requests/${id}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const filteredCustomPlanRequests = customPlanRequests.filter((r) => {
    if (cprStatusFilter !== 'ALL' && r.status !== cprStatusFilter) return false;
    return true;
  });

  const customPlanRequestsTotalPages = Math.ceil(filteredCustomPlanRequests.length / PAGE_SIZE) || 1;
  const customPlanRequestsSafePage = clampPage(customPlanRequestsPage, customPlanRequestsTotalPages);
  const pagedCustomPlanRequests = paginate(filteredCustomPlanRequests, customPlanRequestsSafePage, PAGE_SIZE);

  if (section !== 'custom-plan-requests') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-bold font-heading">
          Custom Plan Requests ({filteredCustomPlanRequests.length})
        </h3>
        <select
          value={cprStatusFilter}
          onChange={(e) => setCprStatusFilter(e.target.value as typeof cprStatusFilter)}
          className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
        >
          <option value="ALL">{lang === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</option>
          {CUSTOM_PLAN_REQUEST_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{CUSTOM_PLAN_REQUEST_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {pagedCustomPlanRequests.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
          Chưa có yêu cầu tư vấn gói riêng nào
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pagedCustomPlanRequests.map((r: any) => (
            <div key={r.id} className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{r.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">{r.phone || '—'}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS[r.status as CustomPlanRequestStatus]}`}
                >
                  {CUSTOM_PLAN_REQUEST_STATUS_LABELS[r.status as CustomPlanRequestStatus] || r.status}
                </span>
              </div>

              <div className="text-xs space-y-1 bg-muted/30 border border-border/50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang === 'vi' ? 'Protein mong muốn:' : 'Desired proteins:'}</span>
                  <span className="font-semibold text-right">
                    {(r.desiredProteins || []).map((p: Protein) => PROTEIN_LABELS[p] || p).join(', ') || '—'}
                  </span>
                </div>
                {r.estimatedTotalGrams != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'vi' ? 'Khối lượng ước tính:' : 'Estimated volume:'}</span>
                    <span className="font-semibold">{formatGrams(r.estimatedTotalGrams)}</span>
                  </div>
                )}
                {r.preferredIntervalDays != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'vi' ? 'Chu kỳ mong muốn:' : 'Desired interval:'}</span>
                    <span className="font-semibold">{formatIntervalLabel(r.preferredIntervalDays)}</span>
                  </div>
                )}
                {r.budgetHint != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'vi' ? 'Ngân sách tham khảo:' : 'Budget hint:'}</span>
                    <span className="font-semibold">{formatVND(r.budgetHint)}</span>
                  </div>
                )}
                {r.notes && (
                  <div className="pt-1 border-t border-border/40 text-primary italic">&ldquo;{r.notes}&rdquo;</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Ghi chú nội bộ
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={cprNoteDrafts[r.id] ?? r.adminNotes ?? ''}
                    onChange={(e) => setCprNoteDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2 px-2.5 rounded-lg outline-none resize-none"
                  />
                  <button
                    onClick={() => handleUpdateCustomPlanRequest(r.id, { adminNotes: cprNoteDrafts[r.id] ?? r.adminNotes ?? '' })}
                    className="text-[10px] font-bold px-2.5 rounded-md border border-border hover:bg-muted cursor-pointer whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <select
                  value={r.status}
                  onChange={(e) => handleUpdateCustomPlanRequest(r.id, { status: e.target.value })}
                  className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                >
                  {CUSTOM_PLAN_REQUEST_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{CUSTOM_PLAN_REQUEST_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  {r.status !== 'MATCHED' && (
                    <button
                      onClick={() => {
                        // This would need to be passed as a prop or callback
                        // For now, we'll just show it
                        toast({ title: 'Cần truyền callback handleOpenSubFromCustomPlanRequest', type: 'error' });
                      }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer whitespace-nowrap"
                    >
                      Tạo gói từ yêu cầu này
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCustomPlanRequest(r.id)}
                    className="text-muted-foreground hover:text-red-500 p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationControls
        page={customPlanRequestsSafePage}
        totalPages={customPlanRequestsTotalPages}
        totalItems={filteredCustomPlanRequests.length}
        pageSize={PAGE_SIZE}
        onChange={setCustomPlanRequestsPage}
      />
    </div>
  );
}
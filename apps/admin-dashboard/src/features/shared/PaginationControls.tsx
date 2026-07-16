'use client';

import { clampPage } from '@/lib/menu-utils';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function PaginationControls({ page, totalPages, onChange, totalItems, pageSize }: Props) {
  if (totalItems === 0 || totalPages <= 1) return null;
  const safePage = clampPage(page, totalPages);
  const rangeStart = (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between gap-3 pt-3 flex-wrap">
      <span className="text-[11px] text-muted-foreground ">
        {rangeStart}–{rangeEnd} / {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onChange(safePage - 1)}
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          ‹ Trước
        </button>
        <span className="text-[11px]  text-muted-foreground px-1.5">
          Trang {safePage}/{totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onChange(safePage + 1)}
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Sau ›
        </button>
      </div>
    </div>
  );
}

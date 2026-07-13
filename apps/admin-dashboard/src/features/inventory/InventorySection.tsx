'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, formatGrams } from '@fortifykitchen/shared';
import type { Protein } from '@fortifykitchen/types';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  menuItems: any[];
  inventorySubTab: 'monitor' | 'add';
  setInventorySubTab: (tab: 'monitor' | 'add') => void;
  inventorySort: 'stock-asc' | 'stock-desc' | 'name';
  setInventorySort: (sort: 'stock-asc' | 'stock-desc' | 'name') => void;
  inventoryPageByProtein: Record<string, number>;
  setInventoryPageByProtein: (pages: Record<string, number>) => void;
  addStockItemId: string;
  setAddStockItemId: (id: string) => void;
  addStockQty: number;
  setAddStockQty: (qty: number) => void;
  isAddingStock: boolean;
  adjustingStockId: string | null;
  setAdjustingStockId: (id: string | null) => void;
  handleAdjustStock: (itemId: string, delta: number) => void;
  handleAddStock: (e: React.FormEvent) => void;
  lang: 'vi' | 'en';
  token: string | null;
  API_URL: string;
}

export default function InventorySection({
  menuItems,
  inventorySubTab,
  setInventorySubTab,
  inventorySort,
  setInventorySort,
  inventoryPageByProtein,
  setInventoryPageByProtein,
  addStockItemId,
  setAddStockItemId,
  addStockQty,
  setAddStockQty,
  isAddingStock,
  adjustingStockId,
  setAdjustingStockId,
  handleAdjustStock,
  handleAddStock,
  lang,
  token,
  API_URL,
}: Props) {
  const { toast } = useToast();

  const [localPages, setLocalPages] = React.useState<Record<string, number>>({});

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const inStockItems = menuItems.filter((m) => (m.stockQuantity ?? 0) > 0);
  const allItemsByProtein = menuItems.reduce((acc, item) => {
    if (!acc[item.protein]) acc[item.protein] = [];
    acc[item.protein].push(item);
    return acc;
  }, {} as Record<Protein, any[]>);

  if (inventorySubTab === 'monitor') {
    if (inStockItems.length === 0) {
      return (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold font-heading">Inventory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {inStockItems.length} of {menuItems.length} dishes currently in stock
            </p>
          </div>

          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setInventorySubTab('monitor')}
              className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-primary text-primary"
            >
              Monitor
            </button>
            <button
              onClick={() => setInventorySubTab('add')}
              className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground"
            >
              Add Stock
            </button>
          </div>

          <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
            Nothing in stock right now — use the Add Stock tab to bring dishes online.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h3 className="text-sm font-bold font-heading">Inventory</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {inStockItems.length} of {menuItems.length} dishes currently in stock
          </p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setInventorySubTab('monitor')}
            className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-primary text-primary"
          >
            Monitor
          </button>
          <button
            onClick={() => setInventorySubTab('add')}
            className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground"
          >
            Add Stock
          </button>
        </div>

        <div className="flex justify-end">
          <select
            value={inventorySort}
            onChange={(e) => setInventorySort(e.target.value as typeof inventorySort)}
            className="text-[11px] font-bold px-2 py-1.5 rounded border border-border bg-background cursor-pointer"
          >
            <option value="stock-desc">{lang === 'vi' ? 'Tồn kho: cao đến thấp' : 'Stock: high to low'}</option>
            <option value="stock-asc">{lang === 'vi' ? 'Tồn kho: thấp đến cao' : 'Stock: low to high'}</option>
            <option value="name">{lang === 'vi' ? 'Tên (A–Z)' : 'Name (A–Z)'}</option>
          </select>
        </div>

        <div className="space-y-4">
          {PROTEIN_OPTIONS.filter((p) =>
            menuItems.some((m) => m.protein === p && (m.stockQuantity ?? 0) > 0)
          ).map((protein) => {
            const items = menuItems
              .filter((m) => m.protein === protein && (m.stockQuantity ?? 0) > 0)
              .sort((a, b) => {
                if (inventorySort === 'name') return a.flavor.localeCompare(b.flavor);
                const diff = (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0);
                return inventorySort === 'stock-asc' ? diff : -diff;
              });

            const itemsTotalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
            const itemsPage = clampPage(localPages[protein] || 1, itemsTotalPages);
            const pagedItems = paginate(items, itemsPage, PAGE_SIZE);

            return (
              <div key={protein} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {PROTEIN_LABELS[protein]}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">({items.length})</span>
                  <div className="flex-1 border-t border-border/60" />
                </div>
                <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/50">
                          <th className="pb-3 font-semibold">{lang === 'vi' ? 'Món' : 'Dish'}</th>
                          <th className="pb-3 font-semibold">{lang === 'vi' ? 'Khối lượng' : 'Size'}</th>
                          <th className="pb-3 font-semibold">{lang === 'vi' ? 'Tồn kho' : 'Stock'}</th>
                          <th className="pb-3 font-semibold text-right">{lang === 'vi' ? 'Điều chỉnh' : 'Adjust'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedItems.map((item) => (
                          <tr key={item.id} className="border-b border-border/20 last:border-0">
                            <td className="py-3 font-bold">{item.flavor}</td>
                            <td className="py-3 text-muted-foreground">{item.sizeGrams}g</td>
                            <td className="py-3 font-bold">{item.stockQuantity ?? 0}</td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAdjustStock(item.id, -1)}
                                  disabled={adjustingStockId === item.id || (item.stockQuantity ?? 0) <= 0}
                                  className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(item.id, 1)}
                                  disabled={adjustingStockId === item.id}
                                  className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    page={localPages[protein] || 1}
                    totalPages={itemsTotalPages}
                    totalItems={items.length}
                    pageSize={PAGE_SIZE}
                    onChange={(p) => {
                      const next = { ...inventoryPageByProtein, [protein]: p } as Record<string, number>;
                      setLocalPages(next);
                      setInventoryPageByProtein(next);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-sm font-bold font-heading">Inventory</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {inStockItems.length} of {menuItems.length} dishes currently in stock
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setInventorySubTab('monitor')}
          className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground"
        >
          Monitor
        </button>
        <button
          onClick={() => setInventorySubTab('add')}
          className="px-4 py-2.5 text-xs font-bold border-b-2 -mb-px border-primary text-primary"
        >
          Add Stock
        </button>
      </div>

      <div className="max-w-md border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
        <p className="text-xs text-muted-foreground">
          Pick a dish and add how many portions just came out of the kitchen. Adding stock makes the
          dish available to customers right away.
        </p>
        <form onSubmit={handleAddStock} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{lang === 'vi' ? 'Món' : 'Dish'}</label>
            <select
              required
              value={addStockItemId}
              onChange={(e) => setAddStockItemId(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
            >
              <option value="">{lang === 'vi' ? '— Chọn món —' : '— Select a dish —'}</option>
              {PROTEIN_OPTIONS.map((protein) => {
                const items = menuItems
                  .filter((m) => m.protein === protein)
                  .sort((a, b) => a.flavor.localeCompare(b.flavor) || a.sizeGrams - b.sizeGrams);
                if (items.length === 0) return null;
                return (
                  <optgroup key={protein} label={PROTEIN_LABELS[protein]}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.flavor} ({item.sizeGrams}g) — {lang === 'vi' ? 'hiện có' : 'currently'} {item.stockQuantity ?? 0}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {lang === 'vi' ? 'Số lượng thêm' : 'Quantity to add'}
            </label>
            <input
              type="number"
              required
              min={1}
              value={addStockQty}
              onChange={(e) => setAddStockQty(Number(e.target.value))}
              className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingStock || !addStockItemId}
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isAddingStock ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
            {lang === 'vi' ? 'Thêm vào kho' : 'Add to Inventory'}
          </button>
        </form>
      </div>
    </div>
  );
}

const PROTEIN_OPTIONS: Protein[] = ['CHICKEN', 'BEEF', 'SHRIMP'];
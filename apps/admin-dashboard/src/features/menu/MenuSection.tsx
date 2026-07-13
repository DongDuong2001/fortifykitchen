'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner, faBox, faChevronDown, faChevronUp, faImage } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, getMenuItemLabel, formatVND, PROTEIN_OPTIONS } from '@fortifykitchen/shared';
import type { Protein } from '@fortifykitchen/types';
import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage, groupMenuByFlavor } from '@/lib/menu-utils';

const PAGE_SIZE = 10;
const CARD_PAGE_SIZE = 8;

interface Props {
  token: string | null;
  API_URL: string;
  menuItems: any[];
  categories: any[];
  lang: 'vi' | 'en';
  section: string;
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function MenuSection({
  token,
  API_URL,
  menuItems,
  categories,
  lang,
  section,
  setMenuItems,
  setCategories,
  loadData,
  handleUnauthorized,
  checkOffline,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [menuModal, setMenuModal] = React.useState<'create' | 'edit' | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = React.useState<string | null>(null);
  const [menuItemProtein, setMenuItemProtein] = React.useState<Protein>('CHICKEN');
  const [menuItemFlavor, setMenuItemFlavor] = React.useState('');
  const [menuItemSizeGrams, setMenuItemSizeGrams] = React.useState(150);
  const [menuItemPrice, setMenuItemPrice] = React.useState(25000);
  const [menuItemImage, setMenuItemImage] = React.useState('');
  const [menuItemImagePreview, setMenuItemImagePreview] = React.useState('');
  const [menuItemUploading, setMenuItemUploading] = React.useState(false);
  const [menuItemCatId, setMenuItemCatId] = React.useState('');
  const [menuItemAvailable, setMenuItemAvailable] = React.useState(true);
  const [menuItemStock, setMenuItemStock] = React.useState(0);
  const [adjustingStockId, setAdjustingStockId] = React.useState<string | null>(null);
  const [menuSelectedSizeByDish, setMenuSelectedSizeByDish] = React.useState<Record<string, string>>({});
  const [menuPageByProtein, setMenuPageByProtein] = React.useState<Record<string, number>>({});

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menuItemUploading) {
      toast({ title: 'Đang tải ảnh lên, vui lòng đợi trước khi lưu.', type: 'default' });
      return;
    }
    try {
      const payload = {
        protein: menuItemProtein,
        flavor: menuItemFlavor,
        sizeGrams: Number(menuItemSizeGrams),
        price: Number(menuItemPrice),
        imageUrl: menuItemImage || undefined,
        categoryId: menuItemCatId || undefined,
        isAvailable: menuItemAvailable,
        stockQuantity: Number(menuItemStock),
      };

      const url = menuModal === 'edit' ? `${API_URL}/menu/${editingMenuItemId}` : `${API_URL}/menu`;
      const method = menuModal === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMenuModal(null);
        resetMenuForm();
        loadData();
      } else {
        let message = 'Failed to save menu item';
        try {
          const error = await res.json();
          message = error.message || message;
        } catch {
          message = `${message} (${res.status} ${res.statusText})`;
        }
        toast({ title: message, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi kết nối khi lưu món ăn', type: 'error' });
    }
  };

  const handleDeleteMenuItem = (itemId: string) => {
    requestConfirm(
      'Are you sure you want to delete this menu item?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/menu/${itemId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            loadData();
          }
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const handleEditMenuItemTrigger = (item: any) => {
    setEditingMenuItemId(item.id);
    setMenuItemProtein(item.protein);
    setMenuItemFlavor(item.flavor);
    setMenuItemSizeGrams(item.sizeGrams);
    setMenuItemPrice(item.price);
    setMenuItemImage(item.imageUrl || '');
    setMenuItemImagePreview(item.imageUrl || '');
    setMenuItemCatId(item.categoryId || '');
    setMenuItemAvailable(item.isAvailable);
    setMenuItemStock(item.stockQuantity ?? 0);
    setMenuModal('edit');
  };

  const resetMenuForm = () => {
    setEditingMenuItemId(null);
    setMenuItemProtein('CHICKEN');
    setMenuItemFlavor('');
    setMenuItemSizeGrams(150);
    setMenuItemPrice(25000);
    setMenuItemImage('');
    setMenuItemImagePreview('');
    setMenuItemUploading(false);
    setMenuItemAvailable(true);
    setMenuItemStock(0);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setMenuItemImagePreview(localPreview);
    setMenuItemUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const body = await res.json();
        const url = body?.data?.url;
        setMenuItemImage(url);
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Upload ảnh thất bại', type: 'error' });
        setMenuItemImagePreview(menuItemImage);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi kết nối khi upload ảnh', type: 'error' });
      setMenuItemImagePreview(menuItemImage);
    } finally {
      setMenuItemUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleAdjustStock = async (itemId: string, delta: number) => {
    if (adjustingStockId === itemId) return;
    setAdjustingStockId(itemId);
    try {
      const res = await fetch(`${API_URL}/menu/${itemId}/stock`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ delta }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setAdjustingStockId(null);
    }
  };

  const groupedDishes = groupMenuByFlavor(menuItems.filter((m) => m.isAvailable));

  if (section !== 'menu') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-bold font-heading">Menu Catalog ({menuItems.length} SKUs)</h3>
        <button
          onClick={() => { resetMenuForm(); setMenuModal('create'); }}
          className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Thêm món mới
        </button>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6">
        {groupedDishes.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
            Chưa có món ăn khả dụng nào — hãy thêm món trong Thực đơn để bắt đầu.
          </div>
        ) : (
          groupedDishes.map((dish) => {
            const protein = dish.protein;
            const sizes = dish.sizes.sort((a: any, b: any) => a.sizeGrams - b.sizeGrams);
            const selectedSizeId = menuSelectedSizeByDish[`${protein}::${dish.flavor}`] || sizes[0]?.id;
            const selectedItem = sizes.find((s: any) => s.id === selectedSizeId) || sizes[0];
            const displayName = `${PROTEIN_LABELS[protein]} ${dish.flavor}`;
            const itemsTotalPages = Math.ceil(sizes.length / CARD_PAGE_SIZE) || 1;
            const itemsPage = clampPage(menuPageByProtein[protein] ?? 1, itemsTotalPages);
            const pagedSizes = paginate(sizes, itemsPage, CARD_PAGE_SIZE);

            return (
              <div key={protein} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{displayName}</h4>
                  <span className="text-[10px] text-muted-foreground">({sizes.length} sizes)</span>
                  <div className="flex-1 border-t border-border/60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {pagedSizes.map((item: any) => (
                    <div key={item.id} className={`border border-border bg-card rounded-2xl p-4 space-y-3 shadow-sm transition-all ${selectedItem.id === item.id ? 'ring-2 ring-primary border-primary' : ''}`} onClick={() => setMenuSelectedSizeByDish((prev) => ({ ...prev, [`${protein}::${dish.flavor}`]: item.id }))}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{item.flavor}</p>
                          <p className="text-[10px] text-muted-foreground">{PROTEIN_LABELS[item.protein as Protein]} · {item.sizeGrams}g</p>
                        </div>
                        <span className="text-xs font-bold text-primary shrink-0">{formatVND(item.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                          {item.isAvailable ? (lang === 'vi' ? 'Có sẵn' : 'Available') : (lang === 'vi' ? 'Ẩn' : 'Hidden')}
                        </span>
                        <span className="font-bold {item.stockQuantity > 0 ? 'text-emerald-700' : 'text-red-600'}">
                          {lang === 'vi' ? 'Tồn kho:' : 'Stock:'} {item.stockQuantity ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <button onClick={(e) => { e.stopPropagation(); handleEditMenuItemTrigger(item); }} className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md flex items-center justify-center gap-1 cursor-pointer">
                          <FontAwesomeIcon icon={faEdit} className="h-3 w-3" /> {lang === 'vi' ? 'Sửa' : 'Edit'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMenuItem(item.id); }} className="py-1.5 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer">
                          <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {sizes.length > CARD_PAGE_SIZE && (
                  <PaginationControls
                    page={itemsPage}
                    totalPages={itemsTotalPages}
                    totalItems={sizes.length}
                    pageSize={CARD_PAGE_SIZE}
                    onChange={(p) => setMenuPageByProtein((prev) => ({ ...prev, [protein]: p }))}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {menuModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setMenuModal(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center pb-1 border-b border-border/40">
              <h3 className="text-lg font-bold font-heading text-foreground">{menuModal === 'create' ? 'Thêm món mới' : 'Chỉnh sửa món'}</h3>
              <p className="text-[11px] text-foreground/50 mt-0.5">{menuModal === 'create' ? 'Điền thông tin để thêm món vào thực đơn' : 'Cập nhật thông tin món ăn'}</p>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Protein</label>
                  <select value={menuItemProtein} onChange={(e) => setMenuItemProtein(e.target.value as Protein)} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors">
                    {PROTEIN_OPTIONS.map((p) => <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Khối lượng (gram)</label>
                  <input type="number" required min={1} value={menuItemSizeGrams} onChange={(e) => setMenuItemSizeGrams(Number(e.target.value))} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Hương vị / Tên món</label>
                <input type="text" required placeholder="vd: xá xíu, sốt cam, rang muối..." value={menuItemFlavor} onChange={(e) => setMenuItemFlavor(e.target.value)} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground placeholder:text-foreground/30 py-2.5 px-3 rounded-lg outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Giá (VND)</label>
                  <input type="number" required min={0} value={menuItemPrice} onChange={(e) => setMenuItemPrice(Number(e.target.value))} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Danh mục (tùy chọn)</label>
                  <select value={menuItemCatId} onChange={(e) => setMenuItemCatId(e.target.value)} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors">
                    <option value="">— Không chọn —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Ảnh sản phẩm (tùy chọn)</label>
                {(menuItemImagePreview || menuItemImage) && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/5">
                    <img src={menuItemImagePreview || menuItemImage} alt="Preview ảnh sản phẩm" className="w-full h-full object-cover" />
                    {menuItemUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" /></div>}
                    {!menuItemUploading && <button type="button" onClick={() => { setMenuItemImage(''); setMenuItemImagePreview(''); }} className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer">Xóa ảnh</button>}
                  </div>
                )}
                <label className={`flex flex-col items-center justify-center gap-1.5 w-full border-2 border-dashed rounded-xl py-4 px-4 transition-all text-xs font-semibold ${menuItemUploading ? 'border-primary/30 text-foreground/30 cursor-not-allowed bg-foreground/[0.02]' : 'border-foreground/25 hover:border-primary hover:bg-primary/5 hover:text-primary text-foreground/50 cursor-pointer bg-white'}`}>
                  {menuItemUploading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span>{menuItemImage ? 'Thay ảnh khác' : 'Nhấn để tải ảnh lên'}</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={menuItemUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ''; }} />
                </label>
                <p className="text-[10px] text-foreground/40">Hỗ trợ: JPG, PNG, WEBP, GIF · Tối đa 5 MB</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Tồn kho (suất đã sẵn sàng)</label>
                <input type="number" min={0} value={menuItemStock} onChange={(e) => setMenuItemStock(Number(e.target.value))} className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors" />
                <p className="text-[10px] text-foreground/40">0 = cần chế biến trước khi giao. Dùng nút +/− trên thẻ món để điều chỉnh nhanh hàng ngày.</p>
              </div>

              <div className="flex items-center gap-2.5 bg-foreground/[0.03] border border-foreground/10 rounded-lg px-3 py-2.5">
                <input type="checkbox" id="avail" checked={menuItemAvailable} onChange={(e) => setMenuItemAvailable(e.target.checked)} className="rounded border-foreground/30 text-primary focus:ring-primary h-4 w-4 accent-primary" />
                <label htmlFor="avail" className="text-xs font-semibold text-foreground/70 select-none cursor-pointer">Hiển thị trong thực đơn (Active)</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMenuModal(null)} className="flex-1 bg-white hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-foreground/20">Hủy</button>
                <button type="submit" disabled={menuItemUploading} className="flex-2 flex-grow-[2] bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/20">{menuModal === 'create' ? 'Thêm món' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
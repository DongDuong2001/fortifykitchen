'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { useToast } from '@fortifykitchen/ui';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  token: string | null;
  API_URL: string;
  homeFrames: any[];
  lang: 'vi' | 'en';
  section: string;
  loadData: () => void;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
}

export default function HomeFramesSection({
  token,
  API_URL,
  homeFrames,
  lang,
  section,
  loadData,
  requestConfirm,
}: Props) {
  const { toast } = useToast();

  const [homeFramesPage, setHomeFramesPage] = React.useState(1);
  const [homeFrameModal, setHomeFrameModal] = React.useState<'create' | 'edit' | null>(null);
  const [editingHomeFrameId, setEditingHomeFrameId] = React.useState<string | null>(null);
  const [homeFrameTitle, setHomeFrameTitle] = React.useState('');
  const [homeFrameImageUrl, setHomeFrameImageUrl] = React.useState('');
  const [homeFrameImagePreview, setHomeFrameImagePreview] = React.useState<string>('');
  const [homeFrameLinkUrl, setHomeFrameLinkUrl] = React.useState('');
  const [homeFrameOrder, setHomeFrameOrder] = React.useState(0);
  const [homeFrameIsActive, setHomeFrameIsActive] = React.useState(true);
  const [isSavingHomeFrame, setIsSavingHomeFrame] = React.useState(false);
  const [isHomeFrameUploading, setIsHomeFrameUploading] = React.useState(false);

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleHomeFrameImageUpload = async (file: File) => {
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setHomeFrameImagePreview(localPreview);
    setIsHomeFrameUploading(true);

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
        setHomeFrameImageUrl(url);
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Upload ảnh thất bại', type: 'error' });
        setHomeFrameImagePreview(homeFrameImageUrl);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi kết nối khi upload ảnh', type: 'error' });
      setHomeFrameImagePreview(homeFrameImageUrl);
    } finally {
      setIsHomeFrameUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const resetHomeFrameForm = () => {
    setEditingHomeFrameId(null);
    setHomeFrameTitle('');
    setHomeFrameImageUrl('');
    setHomeFrameImagePreview('');
    setHomeFrameLinkUrl('');
    setHomeFrameOrder(0);
    setHomeFrameIsActive(true);
  };

  const handleSaveHomeFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeFrameImageUrl.trim()) {
      toast({ title: 'Ảnh khung không được để trống', type: 'error' });
      return;
    }
    try {
      setIsSavingHomeFrame(true);
      const payload = {
        title: homeFrameTitle || undefined,
        imageUrl: homeFrameImageUrl,
        linkUrl: homeFrameLinkUrl || undefined,
        order: Number(homeFrameOrder),
        isActive: homeFrameIsActive,
      };
      const url = homeFrameModal === 'edit' ? `${API_URL}/home-frames/${editingHomeFrameId}` : `${API_URL}/home-frames`;
      const method = homeFrameModal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setHomeFrameModal(null);
        resetHomeFrameForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to save home frame', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingHomeFrame(false);
    }
  };

  const handleDeleteHomeFrame = (id: string) => {
    requestConfirm(
      'Xóa banner này?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/home-frames/${id}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const homeFramesTotalPages = Math.ceil(homeFrames.length / PAGE_SIZE) || 1;
  const homeFramesSafePage = clampPage(homeFramesPage, homeFramesTotalPages);
  const pagedHomeFrames = paginate(homeFrames, homeFramesSafePage, PAGE_SIZE);

  if (section !== 'home-frames') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading">Thay đổi hình ảnh Hero Section Trang chủ (Banners)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cập nhật, thay đổi và sắp xếp các hình ảnh lớn chạy slide xuất hiện ngay dưới tiêu đề chính của trang chủ khách hàng.
          </p>
        </div>
        <button
          onClick={() => {
            resetHomeFrameForm();
            setHomeFrameModal('create');
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-smooth font-heading"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
          Thêm Banner Mới
        </button>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                <th className="pb-3.5 w-24">{lang === 'vi' ? 'Hình ảnh' : 'Image'}</th>
                <th className="pb-3.5">{lang === 'vi' ? 'Tiêu đề (Tùy chọn)' : 'Title (Optional)'}</th>
                <th className="pb-3.5">{lang === 'vi' ? 'Đường dẫn liên kết' : 'Link URL'}</th>
                <th className="pb-3.5 text-center">{lang === 'vi' ? 'Thứ tự' : 'Order'}</th>
                <th className="pb-3.5 text-center">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="pb-3.5 text-center w-24">{lang === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {homeFrames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chưa có banner nào được tạo. Nhấn &ldquo;Thêm Banner Mới&rdquo; để bắt đầu.
                  </td>
                </tr>
              ) : (
                pagedHomeFrames.map((frame: any) => (
                  <tr key={frame.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5">
                      <img
                        src={frame.imageUrl}
                        alt={frame.title || 'Banner'}
                        className="h-12 w-20 rounded-md object-cover border border-border bg-muted"
                      />
                    </td>
                    <td className="py-3.5 font-semibold text-foreground">
                      {frame.title || <span className="text-muted-foreground italic font-normal">{lang === 'vi' ? 'Không có' : 'None'}</span>}
                    </td>
                    <td className="py-3.5 text-muted-foreground break-all">
                      {frame.linkUrl || <span className="text-muted-foreground/50 italic">{lang === 'vi' ? 'Không có' : 'None'}</span>}
                    </td>
                    <td className="py-3.5 text-center font-bold">
                      {frame.order}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          frame.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {frame.isActive ? (lang === 'vi' ? 'Hoạt động' : 'Active') : (lang === 'vi' ? 'Tạm ẩn' : 'Hidden')}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingHomeFrameId(frame.id);
                            setHomeFrameTitle(frame.title || '');
                            setHomeFrameImageUrl(frame.imageUrl);
                            setHomeFrameImagePreview(frame.imageUrl);
                            setHomeFrameLinkUrl(frame.linkUrl || '');
                            setHomeFrameOrder(frame.order);
                            setHomeFrameIsActive(frame.isActive);
                            setHomeFrameModal('edit');
                          }}
                          className="text-primary hover:text-primary/80 p-1.5 cursor-pointer transition-colors"
                          title={lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHomeFrame(frame.id)}
                          className="text-red-500 hover:text-red-600 p-1.5 cursor-pointer transition-colors"
                          title={lang === 'vi' ? 'Xóa' : 'Delete'}
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={homeFramesSafePage}
          totalPages={homeFramesTotalPages}
          totalItems={homeFrames.length}
          pageSize={PAGE_SIZE}
          onChange={setHomeFramesPage}
        />
      </div>

      {homeFrameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setHomeFrameModal(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <form onSubmit={handleSaveHomeFrame} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {lang === 'vi' ? 'Tiêu đề (Tùy chọn)' : 'Title (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Ví dụ: Giảm giá mùa hè' : 'e.g. Summer Sale'}
                  value={homeFrameTitle}
                  onChange={(e) => setHomeFrameTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {lang === 'vi' ? 'Đường dẫn liên kết (Tùy chọn)' : 'Link URL (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Ví dụ: /menu hoặc link ngoài' : 'e.g. /menu or external link'}
                  value={homeFrameLinkUrl}
                  onChange={(e) => setHomeFrameLinkUrl(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === 'vi' ? 'Thứ tự hiển thị' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={homeFrameOrder}
                    onChange={(e) => setHomeFrameOrder(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none font-bold"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pb-2 select-none">
                    <input
                      type="checkbox"
                      checked={homeFrameIsActive}
                      onChange={(e) => setHomeFrameIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{lang === 'vi' ? 'Kích hoạt hiển thị' : 'Active'}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {lang === 'vi' ? 'Hình ảnh Banner' : 'Banner Image'}
                </label>

                <div className="flex flex-col gap-4">
                  {/* Interactive Drag & Drop Area */}
                  <label
                    className={`relative border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group select-none min-h-[140px] ${
                      isHomeFrameUploading ? 'pointer-events-none' : ''
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHomeFrameImageUpload(file);
                      }}
                    />
                    
                    {homeFrameImagePreview ? (
                      <div className="relative w-full max-w-sm aspect-[2.39/1] rounded-lg overflow-hidden border border-border shadow-sm">
                        <img src={homeFrameImagePreview} alt="Preview" className="h-full w-full object-cover" />
                        {isHomeFrameUploading ? (
                          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white gap-2">
                            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">Uploading...</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                            <span className="text-xs font-bold bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                              {lang === 'vi' ? 'Thay đổi ảnh' : 'Change Image'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300">
                          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {lang === 'vi' ? 'Nhấn để tải hình ảnh lên' : 'Click to upload image'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                            {lang === 'vi' 
                              ? 'Chấp nhận PNG, JPG, GIF tối đa 5MB. Tự động đồng bộ lên Cloudinary.' 
                              : 'Accepts PNG, JPG, GIF up to 5MB. Auto-synced to Cloudinary.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Direct URL input fallback */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground/80 block uppercase">
                      {lang === 'vi' ? 'Hoặc nhập đường dẫn URL trực tiếp' : 'Or enter direct image URL'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://..."
                      value={homeFrameImageUrl}
                      onChange={(e) => {
                        setHomeFrameImageUrl(e.target.value);
                        setHomeFrameImagePreview(e.target.value);
                      }}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setHomeFrameModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border transition-colors font-heading"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingHomeFrame || isHomeFrameUploading}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors font-heading"
                >
                  {isSavingHomeFrame ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu banner' : 'Save Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
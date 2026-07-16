'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faBox, faCalendarAlt, faUtensils, faTruck, faWallet } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, formatGrams, ORDER_STATUS_LABELS } from '@fortifykitchen/shared';
import type { Protein, OrderStatus } from '@fortifykitchen/types';


interface Props {
  lang: 'vi' | 'en';
  stats: any;
  menuItems: any[];
  lowBalance: any;
  formatVND: (n: number) => string;
  setSection: (s: any) => void;
}

export default function DashboardSection({ lang, stats, menuItems, lowBalance, formatVND, setSection }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. NEEDS ATTENTION — urgent, actionable, dominant */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {lang === 'vi' ? 'Cần xử lý ngay' : 'Needs attention now'}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: lang === 'vi' ? 'Đơn chờ duyệt' : 'Awaiting acceptance', value: stats.ordersAwaitingAcceptance || 0, icon: faShoppingBag, sectionId: 'orders', cta: lang === 'vi' ? 'Duyệt đơn' : 'Review orders' },
            { label: lang === 'vi' ? 'Món hết hàng' : 'Out of stock', value: (stats.outOfStockItems || []).length, icon: faBox, sectionId: 'inventory', cta: lang === 'vi' ? 'Kiểm kho' : 'Check stock' },
            { label: lang === 'vi' ? 'Cảnh báo số dư thấp' : 'Low balance alerts', value: lowBalance.totalCount || 0, icon: faCalendarAlt, sectionId: 'subscriptions', cta: lang === 'vi' ? 'Xem gói' : 'View plans' },
          ].map((item, idx) => {
            const urgent = item.value > 0;
            return (
              <button
                key={idx}
                onClick={() => setSection(item.sectionId as any)}
                className={`text-left rounded-xl p-5 border-2 transition-smooth hover:opacity-95 cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  urgent ? 'border-red-300 bg-red-50' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${urgent ? 'text-red-700' : 'text-muted-foreground'}`}>{item.label}</span>
                  <FontAwesomeIcon icon={item.icon} className={`h-4 w-4 ${urgent ? 'text-red-500' : 'text-muted-foreground/50'}`} />
                </div>
                <div className="mt-2">
                  <div className={`text-3xl font-bold font-heading ${urgent ? 'text-red-700' : 'text-foreground'}`}>{item.value}</div>
                  <span className={`text-[11px] font-bold ${urgent ? 'text-red-600' : 'text-primary'}`}>{item.cta} →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. OPERATIONS — today & this week */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {lang === 'vi' ? 'Vận hành hôm nay & tuần này' : 'Operations — today & this week'}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: lang === 'vi' ? 'Đang chuẩn bị' : 'In preparation', value: stats.ordersInPreparation || 0, icon: faUtensils, sectionId: 'orders' },
            { label: lang === 'vi' ? 'Món sắp hết' : 'Low stock dishes', value: (stats.lowStockItems || []).length, icon: faBox, sectionId: 'inventory' },
            { label: lang === 'vi' ? 'Giao hàng tuần này' : 'Deliveries this week', value: stats.deliveriesThisWeek || 0, icon: faTruck, sectionId: 'subscriptions' },
            { label: lang === 'vi' ? 'Lượng chưa giao (kg)' : 'Outstanding volume (kg)', value: formatGrams(stats.outstandingVolumeGrams || 0), icon: faTruck, sectionId: 'subscriptions' },
            { label: lang === 'vi' ? 'Gói ăn sắp cạn' : 'Nearing depletion', value: stats.subscriptionsNearingDepletion || 0, icon: faUtensils, sectionId: 'subscriptions' },
            { label: lang === 'vi' ? 'Món sẵn sàng ngay' : 'Dishes ready now', value: stats.dishesReadyNow ?? menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length, icon: faUtensils, sectionId: 'inventory' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSection(item.sectionId as any)}
              className="text-left border border-border bg-card rounded-lg p-4 flex items-center justify-between transition-smooth hover:bg-muted/20 cursor-pointer"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <div className="text-lg font-semibold font-heading">{item.value}</div>
              </div>
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. ALL-TIME — small context footer */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {lang === 'vi' ? 'Tổng quan' : 'All-time'}
        </h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: lang === 'vi' ? 'Tổng doanh thu' : 'Total revenue', value: formatVND(stats.totalRevenue) },
            { label: lang === 'vi' ? 'Đã giao tháng này' : 'Delivered this month', value: formatGrams(stats.gramsDeliveredThisMonth || 0) },
            { label: lang === 'vi' ? 'Gói hoạt động' : 'Active subscriptions', value: stats.activeSubscriptions },
            { label: lang === 'vi' ? 'Tổng khách hàng' : 'Total customers', value: stats.totalCustomers },
            { label: lang === 'vi' ? 'Tổng đơn món' : 'Total food orders', value: stats.totalOrders },
          ].map((item, idx) => (
            <div key={idx} className="bg-muted/20 rounded-lg px-4 py-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
              <div className="text-sm font-bold font-heading mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory alerts — out-of-stock / low-stock dishes */}
      {((stats.outOfStockItems || []).length > 0 || (stats.lowStockItems || []).length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {(stats.outOfStockItems || []).length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold font-heading mb-3 text-red-800">{lang === 'vi' ? 'Hết hàng' : 'Out of Stock'}</h3>
              <ul className="space-y-1.5 text-xs">
                {stats.outOfStockItems.map((m: any) => (
                  <li key={m.id} className="flex justify-between text-red-700">
                    <span>{PROTEIN_LABELS[m.protein as Protein] || m.protein} {m.flavor} ({m.sizeGrams}g)</span>
                    <span className="font-bold">0</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(stats.lowStockItems || []).length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold font-heading mb-3 text-amber-800">{lang === 'vi' ? 'Sắp hết hàng (≤5)' : 'Low Stock (≤5)'}</h3>
              <ul className="space-y-1.5 text-xs">
                {stats.lowStockItems.map((m: any) => (
                  <li key={m.id} className="flex justify-between text-amber-700">
                    <span>{PROTEIN_LABELS[m.protein as Protein] || m.protein} {m.flavor} ({m.sizeGrams}g)</span>
                    <span className="font-bold">{m.stockQuantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Low-balance alerts — customer wallets running low and
          subscription pools nearing depletion (fewer than ~3
          deliveries' worth left). In-app only, per
          docs/plan-and-credit-design.md. */}
      {(lowBalance.totalCount || 0) > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSection('customers')}
            className="w-full text-left border border-amber-300 bg-amber-50 rounded-lg p-4 flex items-center justify-between hover:opacity-90 transition-smooth cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md border border-amber-300 bg-amber-100 text-amber-700">
                <FontAwesomeIcon icon={faWallet} className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-amber-800">
                {lang === 'vi' ? `${lowBalance.totalCount} cảnh báo số dư thấp cần chú ý` : `${lowBalance.totalCount} low balance warnings require attention`}
              </span>
            </div>
          </button>
          <div className="grid gap-6 sm:grid-cols-2">
            {(lowBalance.walletsLow || []).length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
                <h3 className="text-sm font-bold font-heading mb-3 text-amber-800">{lang === 'vi' ? 'Ví khách hàng sắp cạn' : 'Wallets running low'}</h3>
                <ul className="space-y-1.5 text-xs">
                  {lowBalance.walletsLow.map((w: any) => (
                    <li key={w.customerId} className="flex justify-between text-amber-700">
                      <span>{w.customerName}</span>
                      <span className="font-bold">{formatVND(w.walletBalance)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(lowBalance.poolsLow || []).length > 0 && (
              <div className="border border-rose-200 bg-rose-50 rounded-2xl p-6">
                <h3 className="text-sm font-bold font-heading mb-3 text-rose-800">{lang === 'vi' ? 'Gói ăn sắp hết lượng' : 'Subscription pools low'}</h3>
                <ul className="space-y-1.5 text-xs">
                  {lowBalance.poolsLow.map((p: any) => (
                    <li key={p.subscriptionId} className="flex justify-between text-rose-700 gap-2">
                      <span>
                        {p.customerName} · {p.packageName} · {PROTEIN_LABELS[p.protein as Protein] || p.protein}
                      </span>
                      <span className="font-bold whitespace-nowrap">{formatGrams(p.remainingGrams)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders List */}
      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold font-heading mb-4">{lang === 'vi' ? 'Đơn hàng gần đây' : 'Recent Incoming Orders'}</h3>
        {/* Mobile cards view */}
        <div className="md:hidden space-y-3">
          {stats.recentOrders?.map((o: any) => (
            <div key={o.id} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground">{o.customerName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <span className="font-bold text-primary">{formatVND(o.total)}</span>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    o.fulfillmentType === 'IMMEDIATE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {o.fulfillmentType === 'IMMEDIATE' ? (lang === 'vi' ? 'Giao ngay' : 'Ready Now') : (lang === 'vi' ? 'Cần chuẩn bị' : 'Needs Prep')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50 pb-2">
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Số tiền' : 'Amount'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Điều phối' : 'Fulfillment'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Ngày đặt' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders?.map((o: any) => (
                <tr key={o.id} className="border-b border-border/20 last:border-0">
                  <td className="py-3.5 font-bold">{o.customerName}</td>
                  <td className="py-3.5 font-semibold text-primary">{formatVND(o.total)}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        o.fulfillmentType === 'IMMEDIATE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {o.fulfillmentType === 'IMMEDIATE' ? (lang === 'vi' ? 'Giao ngay' : 'Ready Now') : (lang === 'vi' ? 'Cần chuẩn bị' : 'Needs Prep')}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

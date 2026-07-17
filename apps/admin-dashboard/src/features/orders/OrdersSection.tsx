'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS, getMenuItemLabel, formatVND, calculateOrderTotal, ORDER_STATUS_LABELS } from '@fortifykitchen/shared';
import type { Protein, OrderStatus, OrderFulfillmentType } from '@fortifykitchen/types';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';
import { getLocalDateString, isToday } from '@/lib/date-utils';

const PAGE_SIZE = 10;
const PAYMENT_STATE_OPTIONS = ['UNPAID', 'DEPOSIT', 'PAID'] as const;
const ORDER_STATUS_OPTIONS = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

interface Props {
  token: string | null;
  API_URL: string;
  orders: any[];
  customers: any[];
  menuItems: any[];
  categories: any[];
  lang: 'vi' | 'en';
  section: string;
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
  requestConfirm: (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string; variant?: 'default' | 'destructive' }) => void;
  toast: any;
}

export default function OrdersSection({
  token,
  API_URL,
  orders,
  customers,
  menuItems,
  categories: _categories,
  lang,
  section,
  setOrders: _setOrders,
  setCustomers: _setCustomers,
  setMenuItems: _setMenuItems,
  loadData,
  handleUnauthorized: _handleUnauthorized,
  checkOffline: _checkOffline,
  requestConfirm,
  toast,
}: Props) {
  const [orderViewTab, setOrderViewTab] = React.useState<'ALL' | OrderStatus>('PENDING_CONFIRMATION');
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<'ALL' | OrderStatus>('ALL');
  const [orderFulfillmentFilter, setOrderFulfillmentFilter] = React.useState<'ALL' | 'IMMEDIATE' | 'SCHEDULED'>('ALL');
  const [orderSourceFilter, setOrderSourceFilter] = React.useState<'ALL' | 'ONE_OFF' | 'SUBSCRIPTION'>('ALL');
  const [orderSearch, setOrderSearch] = React.useState('');
  const [orderDateFilter, setOrderDateFilter] = React.useState('');
  const [orderDateMode, setOrderDateMode] = React.useState<'date' | 'upcoming'>('date');
  const [ordersPage, setOrdersPage] = React.useState(1);

  const [orderModal, setOrderModal] = React.useState<'create' | 'edit' | null>(null);
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  const [orderDetailView, setOrderDetailView] = React.useState<any | null>(null);
  const [orderCustomerId, setOrderCustomerId] = React.useState('');
  const [orderDeliveryDate, setOrderDeliveryDate] = React.useState(getLocalDateString());
  const [orderPaymentStatus, setOrderPaymentStatus] = React.useState<'UNPAID' | 'DEPOSIT' | 'PAID'>('UNPAID');
  const [orderLineItems, setOrderLineItems] = React.useState<any[]>([]);
  const [orderSelectedMenuItemId, setOrderSelectedMenuItemId] = React.useState('');
  const [orderAddQty, setOrderAddQty] = React.useState(1);

  React.useEffect(() => {
    setOrdersPage(1);
  }, [orderViewTab, orderStatusFilter, orderFulfillmentFilter, orderSourceFilter, orderSearch, orderDateFilter, orderDateMode]);

  const authHeaders = React.useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  /*
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
      else {
        const error = await res.json().catch(() => null);
        toast({ title: error?.message || 'Failed to update order status', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostponeOrder = (orderId: string) => {
    requestConfirm('Hoãn đơn này? Toàn bộ lịch còn lại sẽ dời sau một chu kỳ, số lượng được bảo lưu.', async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}/postpone`, { method: 'POST', headers: authHeaders() });
        if (res.ok) loadData();
        else {
          const error = await res.json().catch(() => null);
          toast({ title: error?.message || 'Failed to postpone order', type: 'error' });
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };
  */

  const handleDeleteOrder = (orderId: string) => {
    requestConfirm(
      'Xóa đơn hàng này?',
      async () => {
        try {
          const res = await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE', headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: 'destructive' },
    );
  };

  const addOrderLineItem = () => {
    const menuItem = menuItems.find((m) => m.id === orderSelectedMenuItemId);
    if (!menuItem || orderAddQty <= 0) return;
    setOrderLineItems((prev) => {
      const existing = prev.find((l) => l.menuItemId === orderSelectedMenuItemId);
      if (existing) {
        return prev.map((l) => (l.menuItemId === orderSelectedMenuItemId ? { ...l, qty: l.qty + orderAddQty } : l));
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          protein: menuItem.protein,
          flavor: menuItem.flavor,
          sizeGrams: menuItem.sizeGrams,
          unitPrice: menuItem.price,
          qty: orderAddQty,
        },
      ];
    });
    setOrderAddQty(1);
  };

  const orderPricing = orderLineItems.length > 0 ? calculateOrderTotal(orderLineItems) : null;

  const resetOrderForm = () => {
    setEditingOrderId(null);
    setOrderCustomerId('');
    setOrderDeliveryDate(getLocalDateString());
    setOrderPaymentStatus('UNPAID');
    setOrderLineItems([]);
  };

  const handleEditOrderTrigger = (o: any) => {
    setEditingOrderId(o.id);
    setOrderCustomerId(o.customerId || '');
    setOrderDeliveryDate(o.deliveryDate?.split('T')[0] || getLocalDateString());
    setOrderPaymentStatus(o.paymentStatus || 'UNPAID');
    setOrderLineItems((o.items || []).map((i: any) => ({ ...i })));
    setOrderModal('edit');
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomerId) { toast({ title: 'Vui lòng chọn khách hàng', type: 'error' }); return; }
    if (orderLineItems.length === 0) { toast({ title: 'Vui lòng thêm ít nhất 1 món', type: 'error' }); return; }
    try {
      const payload = {
        customerId: orderCustomerId,
        deliveryDate: orderDeliveryDate,
        paymentStatus: orderPaymentStatus,
        items: orderLineItems.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty })),
      };
      const url = orderModal === 'edit' ? `${API_URL}/orders/${editingOrderId}` : `${API_URL}/orders`;
      const method = orderModal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setOrderModal(null);
        resetOrderForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to save order', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderViewTab !== 'ALL' && o.status !== orderViewTab) return false;
    if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
    if (orderFulfillmentFilter !== 'ALL' && o.fulfillmentType !== orderFulfillmentFilter) return false;
    if (orderSourceFilter !== 'ALL' && o.source !== orderSourceFilter) return false;
    if (orderSearch && !o.customerName?.toLowerCase().includes(orderSearch.toLowerCase())) return false;
    if (orderDateMode === 'date' && orderDateFilter) {
      const orderDate = new Date(o.deliveryDate).toISOString().split('T')[0];
      if (orderDate !== orderDateFilter) return false;
    }
    if (orderDateMode === 'upcoming' && isToday(o.deliveryDate)) return false;
    return true;
  });

  const ordersTotalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const ordersSafePage = clampPage(ordersPage, ordersTotalPages);
  const pagedOrders = paginate(filteredOrders, ordersSafePage, PAGE_SIZE);

  const getFulfillmentBadge = (type: OrderFulfillmentType) => {
    if (type === 'IMMEDIATE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
          {lang === 'vi' ? 'Giao ngay' : 'Ready Now'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
        {lang === 'vi' ? 'Cần chuẩn bị' : 'Needs Prep'}
      </span>
    );
  };

  const getStatusBadge = (status: OrderStatus) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ORDER_STATUS_BADGE_CLASS[status] || ORDER_STATUS_BADGE_CLASS.PENDING_CONFIRMATION}`}>
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );

  const renderOrderRow = (o: any, _index?: number) => (
    <tr key={o.id} className="border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setOrderDetailView(o)}>
      <td className="py-3.5 font-bold">{o.customerName}</td>
      <td className="py-3.5 font-semibold text-primary">{formatVND(o.total)}</td>
      <td className="py-3.5">
        {o.source === 'SUBSCRIPTION' ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap" title={o.packageName}>
            {lang === 'vi' ? 'Định kỳ' : 'Sub'}: {o.packageName || '—'}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
            {lang === 'vi' ? 'Mua lẻ' : 'One-off'}
          </span>
        )}
      </td>
      <td className="py-3.5">{getFulfillmentBadge(o.fulfillmentType)}</td>
      <td className="py-3.5">{getStatusBadge(o.status)}</td>
      <td className="py-3.5 text-muted-foreground">{new Date(o.deliveryDate).toLocaleDateString('vi-VN')}</td>
      <td className="py-3.5 text-muted-foreground">{o.paymentStatus}</td>
      <td className="py-3.5">
        <div className="flex justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditOrderTrigger(o); }}
            className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0 p-1"
            title={lang === 'vi' ? 'Sửa' : 'Edit'}
          >
            <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id); }}
            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0 p-1"
            title={lang === 'vi' ? 'Xóa' : 'Delete'}
          >
            <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderOrderCard = (o: any) => (
    <div key={o.id} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs" onClick={() => setOrderDetailView(o)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-foreground">{o.customerName}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.deliveryDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <span className="font-bold text-primary">{formatVND(o.total)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {getFulfillmentBadge(o.fulfillmentType)}
        {getStatusBadge(o.status)}
        {o.source === 'SUBSCRIPTION' ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
            {lang === 'vi' ? 'Gói đăng ký' : 'Subscription'}: {o.packageName || '—'}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
            {lang === 'vi' ? 'Mua lẻ' : 'One-off'}
          </span>
        )}
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
          {o.paymentStatus}
        </span>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/30">
        <button
          onClick={(e) => { e.stopPropagation(); handleEditOrderTrigger(o); }}
          className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer"
        >
          {lang === 'vi' ? 'Sửa' : 'Edit'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id); }}
          className="py-1.5 px-2 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
        >
          <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  if (section !== 'orders') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-bold font-heading">Orders ({orders.length})</h3>
        <button
          onClick={() => { resetOrderForm(); setOrderModal('create'); }}
          className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> {lang === 'vi' ? 'Tạo đơn hàng' : 'Create Order'}
        </button>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap gap-2">
          {['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setOrderViewTab(status as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                orderViewTab === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {lang === 'vi' ? ORDER_STATUS_LABELS[status as OrderStatus] : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <input
              type="text"
              placeholder={lang === 'vi' ? 'Tìm kiếm theo tên khách...' : 'Search by customer...'}
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border focus:border-primary text-xs rounded-lg outline-none"
            />
          </div>
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value as any)}
            className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
          >
            <option value="ALL">{lang === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</option>
            {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{lang === 'vi' ? ORDER_STATUS_LABELS[s] : s}</option>)}
          </select>
          <select
            value={orderFulfillmentFilter}
            onChange={(e) => setOrderFulfillmentFilter(e.target.value as any)}
            className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
          >
            <option value="ALL">{lang === 'vi' ? 'Tất cả điều phối' : 'All fulfillment'}</option>
            <option value="IMMEDIATE">{lang === 'vi' ? 'Giao ngay' : 'Ready Now'}</option>
            <option value="SCHEDULED">{lang === 'vi' ? 'Cần chuẩn bị' : 'Needs Prep'}</option>
          </select>
          <select
            value={orderSourceFilter}
            onChange={(e) => setOrderSourceFilter(e.target.value as any)}
            className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
          >
            <option value="ALL">{lang === 'vi' ? 'Tất cả nguồn' : 'All sources'}</option>
            <option value="ONE_OFF">{lang === 'vi' ? 'Mua lẻ' : 'One-off'}</option>
            <option value="SUBSCRIPTION">{lang === 'vi' ? 'Từ gói đăng ký' : 'From subscription'}</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setOrderDateFilter(''); setOrderDateMode('date'); }}
              className={`px-2 py-2 rounded border text-[10px] font-bold cursor-pointer ${orderDateMode === 'date' && !orderDateFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
            >
              {lang === 'vi' ? 'Tất cả' : 'All'}
            </button>
            <input
              type="date"
              value={orderDateFilter}
              onChange={(e) => { setOrderDateFilter(e.target.value); setOrderDateMode('date'); }}
              className="bg-background border border-border focus:border-primary text-xs py-2 px-3 rounded-lg outline-none"
            />
            <button
              onClick={() => setOrderDateMode('upcoming')}
              className={`px-2 py-2 rounded border text-[10px] font-bold cursor-pointer ${orderDateMode === 'upcoming' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
            >
              {lang === 'vi' ? 'Sắp tới' : 'Upcoming'}
            </button>
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {pagedOrders.map(renderOrderCard)}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50 pb-2">
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Số tiền' : 'Amount'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Nguồn đơn' : 'Source'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Điều phối' : 'Fulfillment'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Ngày giao' : 'Delivery Date'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Thanh toán' : 'Payment'}</th>
                <th className="pb-3 font-semibold text-center">{lang === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map(renderOrderRow)}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={ordersSafePage}
          totalPages={ordersTotalPages}
          totalItems={filteredOrders.length}
          pageSize={PAGE_SIZE}
          onChange={setOrdersPage}
        />
      </div>

      {orderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setOrderModal(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">{orderModal === 'create' ? (lang === 'vi' ? 'Tạo đơn hàng' : 'Create Order') : (lang === 'vi' ? 'Sửa đơn hàng' : 'Edit Order')}</h3>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{lang === 'vi' ? 'Khách hàng' : 'Customer'}</label>
                  <select
                    required
                    value={orderCustomerId}
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">{lang === 'vi' ? 'Chọn khách hàng' : 'Select customer'}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{lang === 'vi' ? 'Ngày giao' : 'Delivery Date'}</label>
                  <input
                    type="date"
                    required
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{lang === 'vi' ? 'Trạng thái thanh toán' : 'Payment Status'}</label>
                <select
                  value={orderPaymentStatus}
                  onChange={(e) => setOrderPaymentStatus(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{lang === 'vi' ? 'Món ăn' : 'Menu Items'}</label>
                <div className="flex gap-2">
                  <select
                    value={orderSelectedMenuItemId}
                    onChange={(e) => setOrderSelectedMenuItemId(e.target.value)}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">{lang === 'vi' ? 'Chọn món' : 'Select item'}</option>
                    {menuItems.map((m) => <option key={m.id} value={m.id}>{getMenuItemLabel(m)} — {formatVND(m.price)}</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={orderAddQty}
                    onChange={(e) => setOrderAddQty(Number(e.target.value))}
                    className="w-20 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addOrderLineItem}
                    className="bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold px-4 rounded-lg border border-border cursor-pointer"
                  >
                    {lang === 'vi' ? 'Thêm' : 'Add'}
                  </button>
                </div>

                {orderLineItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {orderLineItems.map((l, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span>{PROTEIN_LABELS[l.protein as Protein] || l.protein} {l.flavor} ({l.sizeGrams}g) × {l.qty}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatVND(l.unitPrice * l.qty)}</span>
                          <button
                            type="button"
                            onClick={() => setOrderLineItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {orderPricing && (
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{lang === 'vi' ? 'Tạm tính' : 'Subtotal'}</span>
                      <span>{formatVND(orderPricing.lineSubtotal)}</span>
                    </div>
                    {orderPricing.orderDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>{lang === 'vi' ? 'Giảm giá' : 'Discount'}</span>
                        <span>-{formatVND(orderPricing.orderDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-primary text-sm pt-1">
                      <span>{lang === 'vi' ? 'Tổng cộng' : 'Total'}</span>
                      <span>{formatVND(orderPricing.finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  {lang === 'vi' ? 'Lưu đơn hàng' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderDetailView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setOrderDetailView(null)} />
          <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-5 my-8">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-bold font-heading">{orderDetailView.customerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'vi' ? 'Giao' : 'Deliver'} {new Date(orderDetailView.deliveryDate).toLocaleDateString('vi-VN')}
                  {orderDetailView.createdAt && <><> · {lang === 'vi' ? 'Đặt lúc' : 'Placed'} {new Date(orderDetailView.createdAt).toLocaleString('vi-VN')}</></>}
                </p>
              </div>
              <button onClick={() => setOrderDetailView(null)} className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 text-xl leading-none">×</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {getFulfillmentBadge(orderDetailView.fulfillmentType)}
              {getStatusBadge(orderDetailView.status)}
              {orderDetailView.source === 'SUBSCRIPTION' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
                  {lang === 'vi' ? 'Gói đăng ký' : 'Subscription'}: {orderDetailView.packageName || '—'}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
                {orderDetailView.paymentStatus}
              </span>
              {orderDetailView.type && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                  {orderDetailView.type === 'IMMEDIATE_DELIVERY' ? (lang === 'vi' ? 'Giao ngay' : 'Immediate') : (lang === 'vi' ? 'Pre-order' : 'Pre-order')}
                </span>
              )}
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">{lang === 'vi' ? 'Địa chỉ giao hàng:' : 'Delivery Address:'}</span>
                <span className="font-semibold text-right max-w-[250px]">{orderDetailView.deliveryAddress || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">{lang === 'vi' ? 'Phương thức thanh toán:' : 'Payment Method:'}</span>
                <span className="font-semibold">{orderDetailView.paymentMethod === 'BANK_TRANSFER' ? 'VietQR Chuyển khoản' : 'Ship COD (Tiền mặt)'}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg divide-y divide-border/50">
              {(orderDetailView.items || []).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div>
                    <span className="font-bold">{i.flavor}</span>
                    <span className="text-muted-foreground"> · {i.sizeGrams}g × {i.qty}</span>
                  </div>
                  <span className=" text-muted-foreground">{formatVND(i.unitPrice * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{lang === 'vi' ? 'Tạm tính' : 'Subtotal'}</span>
                <span className="">{formatVND(orderDetailView.subtotal)}</span>
              </div>
              {orderDetailView.discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{lang === 'vi' ? 'Giảm giá' : 'Discount'}</span>
                  <span className="">−{formatVND(orderDetailView.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-border/50">
                <span>{lang === 'vi' ? 'Tổng cộng' : 'Total'}</span>
                <span className="text-primary">{formatVND(orderDetailView.total)}</span>
              </div>
            </div>

            {orderDetailView.notes && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">&ldquo;{orderDetailView.notes}&rdquo;</p>
            )}

            {orderDetailView.systemNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold mb-0.5">{lang === 'vi' ? 'Lưu ý hệ thống:' : 'System Notes:'}</p>
                <p>{orderDetailView.systemNotes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setOrderDetailView(null)} className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border">
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button
                onClick={() => { handleEditOrderTrigger(orderDetailView); setOrderDetailView(null); }}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" /> {lang === 'vi' ? 'Sửa đơn hàng' : 'Edit Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
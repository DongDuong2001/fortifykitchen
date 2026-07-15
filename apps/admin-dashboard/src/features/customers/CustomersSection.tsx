'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faWallet } from '@fortawesome/free-solid-svg-icons';
import PaginationControls from '@/features/shared/PaginationControls';
import { paginate, clampPage } from '@/lib/menu-utils';

const PAGE_SIZE = 10;

interface Props {
  customers: any[];
  customersPage: number;
  setCustomersPage: (p: number) => void;
  resetCustomerForm: () => void;
  setCustomerModal: (m: 'create' | 'edit' | null) => void;
  handleEditCustomerTrigger: (c: any) => void;
  handleDeleteCustomer: (id: string) => void;
  lang: 'vi' | 'en';
  section: string;
  formatVND: (n: number) => string;
}

export default function CustomersSection({
  customers,
  customersPage,
  setCustomersPage,
  resetCustomerForm,
  setCustomerModal,
  handleEditCustomerTrigger,
  handleDeleteCustomer,
  lang,
  section,
  formatVND,
}: Props) {
  if (section !== 'customers') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-bold font-heading">{lang === 'vi' ? 'Khách hàng' : 'Customers'} ({customers.length})</h3>
        <button
          onClick={() => { resetCustomerForm(); setCustomerModal('create'); }}
          className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> {lang === 'vi' ? 'Thêm khách hàng' : 'Add Customer'}
        </button>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
        <div className="md:hidden space-y-3">
          {paginate(customers, clampPage(customersPage, Math.ceil(customers.length / PAGE_SIZE) || 1), PAGE_SIZE).map((c) => (
            <div key={c.id} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground">{c.name}</p>
                  <p className="text-muted-foreground mt-0.5">{lang === 'vi' ? 'SĐT' : 'Phone'}: {c.phone || '—'}</p>
                  <p className="text-muted-foreground">{lang === 'vi' ? 'Zalo' : 'Zalo'}: {c.zalo || '—'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEditCustomerTrigger(c)}
                    className="text-muted-foreground hover:text-primary p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                  >
                    <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(c.id)}
                    className="text-muted-foreground hover:text-red-500 p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground bg-background p-2 rounded-lg border border-border/40">
                <span className="font-semibold text-foreground">{lang === 'vi' ? 'Địa chỉ' : 'Address'}:</span> {c.address || '—'}
              </div>
              <div className="flex items-center justify-between text-[11px] bg-primary/5 border border-primary/20 p-2 rounded-lg">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faWallet} className="h-3 w-3 text-primary" /> {lang === 'vi' ? 'Số dư ví' : 'Wallet'}:
                </span>
                <span className="font-bold text-primary">{formatVND(c.walletBalance || 0)}</span>
              </div>
              {c.planDiscountPercent > 0 && c.planDiscountEndsAt && new Date(c.planDiscountEndsAt) > new Date() && (
                <div className="flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                  <span className="font-semibold text-foreground">{lang === 'vi' ? 'Ưu đãi gói' : 'Plan discount'}:</span>
                  <span className="font-bold text-emerald-700">
                    {c.planDiscountPercent}% — đến {new Date(c.planDiscountEndsAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50 pb-3">
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Tên' : 'Name'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'SĐT' : 'Phone'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Zalo' : 'Zalo'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Địa chỉ' : 'Address'}</th>
                <th className="pb-3 font-semibold text-right">{lang === 'vi' ? 'Số dư ví' : 'Wallet Balance'}</th>
                <th className="pb-3 font-semibold">{lang === 'vi' ? 'Ưu đãi gói' : 'Plan Discount'}</th>
                <th className="pb-3 font-semibold text-center">{lang === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paginate(customers, clampPage(customersPage, Math.ceil(customers.length / PAGE_SIZE) || 1), PAGE_SIZE).map((c) => (
                <tr key={c.id} className="border-b border-border/20 last:border-0">
                  <td className="py-3.5 font-bold">{c.name}</td>
                  <td className="py-3.5 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="py-3.5 text-muted-foreground">{c.zalo || '—'}</td>
                  <td className="py-3.5 text-muted-foreground truncate max-w-[200px]">{c.address || '—'}</td>
                  <td className="py-3.5 text-right font-bold text-primary">{formatVND(c.walletBalance || 0)}</td>
                  <td className="py-3.5">
                    {c.planDiscountPercent > 0 && c.planDiscountEndsAt && new Date(c.planDiscountEndsAt) > new Date() ? (
                      <span className="font-bold text-emerald-700">
                        {c.planDiscountPercent}% đến {new Date(c.planDiscountEndsAt).toLocaleDateString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditCustomerTrigger(c)}
                        className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={customersPage}
          totalPages={Math.ceil(customers.length / PAGE_SIZE) || 1}
          totalItems={customers.length}
          pageSize={PAGE_SIZE}
          onChange={setCustomersPage}
        />
      </div>
    </div>
  );
}
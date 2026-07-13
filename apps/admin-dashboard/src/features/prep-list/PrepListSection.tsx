'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { PROTEIN_LABELS } from '@fortifykitchen/shared';
import type { Protein } from '@fortifykitchen/types';

interface Props {
  token: string | null;
  API_URL: string;
  prepDate: string;
  setPrepDate: (date: string) => void;
  prepData: {
    prepItems: { protein: Protein; flavor: string; sizeGrams: number; portions: number; totalGrams: number }[];
    totalPortions: number;
    totalGrams: number;
  };
  isPrepLoading: boolean;
  prepError: string | null;
  lang: 'vi' | 'en';
  section: string;
  loadData: () => void;
  handleUnauthorized: (responses: any[]) => boolean;
  checkOffline: (responses: any[]) => boolean;
}

export default function PrepListSection({
  token,
  API_URL,
  prepDate,
  setPrepDate,
  prepData,
  isPrepLoading,
  prepError,
  lang,
  section,
  loadData,
  handleUnauthorized,
  checkOffline,
}: Props) {
  if (section !== 'prep-list') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold font-heading flex items-center gap-2">
            <FontAwesomeIcon icon={faUtensils} className="h-4 w-4 text-primary" />
            Prep List
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Tổng hợp nguyên liệu cần chuẩn bị</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-semibold">{lang === 'vi' ? 'Ngày:' : 'Date:'}</label>
          <input
            type="date"
            value={prepDate}
            onChange={(e) => setPrepDate(e.target.value)}
            className="bg-background border border-border focus:border-primary text-xs py-2 px-3 rounded-md outline-none"
          />
        </div>
      </div>

      {prepError && (
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-xs font-medium">
          {prepError}
        </div>
      )}

      {isPrepLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">{lang === 'vi' ? 'Đang tổng hợp...' : 'Compiling...'}</span>
        </div>
      ) : prepData.prepItems.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-20 text-center">
          <FontAwesomeIcon icon={faUtensils} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-medium">{lang === 'vi' ? 'Không có gì cần chuẩn bị' : 'Nothing to prep'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'vi' ? `Ngày ${prepDate} không có đơn hàng hoặc giao hàng nào` : `No orders or deliveries for ${prepDate}`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border bg-card rounded-lg p-5">
              <div className="text-3xl font-bold font-heading text-primary">{prepData.totalPortions}</div>
              <div className="text-xs text-muted-foreground mt-1">{lang === 'vi' ? 'Tổng phần' : 'Total portions'}</div>
            </div>
            <div className="border border-border bg-card rounded-lg p-5">
              <div className="text-3xl font-bold font-heading text-primary">
                {(prepData.totalGrams / 1000).toFixed(1)} kg
              </div>
              <div className="text-xs text-muted-foreground mt-1">{lang === 'vi' ? 'Tổng khối lượng' : 'Total weight'}</div>
            </div>
          </div>

          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground">{lang === 'vi' ? 'Món' : 'Dish'}</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground text-center">{lang === 'vi' ? 'Phần' : 'Portions'}</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground text-right">{lang === 'vi' ? 'Tổng gram' : 'Total grams'}</th>
                  </tr>
                </thead>
                <tbody>
                  {prepData.prepItems.map((item, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            item.protein === 'CHICKEN'
                              ? 'bg-amber-400'
                              : item.protein === 'BEEF'
                                ? 'bg-red-400'
                                : 'bg-pink-400'
                          }`}
                        />
                        {PROTEIN_LABELS[item.protein] || item.protein} {item.flavor}
                        <span className="text-muted-foreground ml-1">({item.sizeGrams}g)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md font-bold ">
                          {item.portions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold ">
                        {item.totalGrams.toLocaleString()}g
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 bg-primary/5">
                    <td className="px-4 py-3 font-bold">{lang === 'vi' ? 'Tổng cộng' : 'Total'}</td>
                    <td className="px-4 py-3 text-center font-bold ">{prepData.totalPortions}</td>
                    <td className="px-4 py-3 text-right font-bold ">
                      {prepData.totalGrams.toLocaleString()}g
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
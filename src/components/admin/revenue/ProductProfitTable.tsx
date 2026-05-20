'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { ProductProfitRow } from '@/types';

function marginTone(pct: number) {
  if (pct >= 40) return 'text-emerald-700 bg-emerald-50';
  if (pct >= 20) return 'text-blue-800 bg-blue-50';
  if (pct > 0) return 'text-amber-800 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

export default function ProductProfitTable({ products }: { products: ProductProfitRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'margin' | 'units'>('profit');

  if (!products.length) {
    return (
      <p className="text-sm text-gray-500 py-10 text-center">
        No paid sales yet — profit breakdown appears after orders are paid.
      </p>
    );
  }

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'margin') return b.marginPercent - a.marginPercent;
    if (sortBy === 'units') return b.unitsSold - a.unitsSold;
    return b.profit - a.profit;
  });

  const totals = sorted.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenue,
      cogs: acc.cogs + p.cogs,
      profit: acc.profit + p.profit,
      units: acc.units + p.unitsSold,
    }),
    { revenue: 0, cogs: 0, profit: 0, units: 0 },
  );
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Sort by</span>
        {(
          [
            ['profit', 'Profit'],
            ['revenue', 'Revenue'],
            ['margin', 'Margin %'],
            ['units', 'Units'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              sortBy === key ?
                'bg-navy-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary row — one glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-navy-950 text-white p-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase">Total sold</p>
          <p className="text-lg font-bold tabular-nums">{totals.units.toLocaleString()} u</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase">Line revenue</p>
          <p className="text-lg font-bold tabular-nums">{formatPrice(totals.revenue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase">Total COGS</p>
          <p className="text-lg font-bold tabular-nums">{formatPrice(totals.cogs)}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase">Gross profit</p>
          <p className="text-lg font-bold tabular-nums text-emerald-400">
            {formatPrice(totals.profit)} · {totalMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {sorted.map((p, idx) => {
          const id = String(p._id);
          const open = expandedId === id;
          const missingCost = p.linesMissingCost > 0;
          return (
            <div key={id} className="bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : id)}
                className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left hover:bg-gray-50/80 transition-colors"
              >
                {open ?
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                <span className="text-xs font-bold text-gray-300 w-5 tabular-nums">{idx + 1}</span>
                <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-100">
                  {p.image ?
                    <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                  : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{p.category}</p>
                </div>
                <div className="hidden sm:grid sm:grid-cols-4 gap-3 text-right shrink-0">
                  <div>
                    <p className="text-[10px] text-gray-400">Sold</p>
                    <p className="text-xs font-bold tabular-nums">{p.unitsSold}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Revenue</p>
                    <p className="text-xs font-bold tabular-nums">{formatPrice(p.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Profit</p>
                    <p className="text-xs font-bold tabular-nums text-emerald-700">{formatPrice(p.profit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Margin</p>
                    <span
                      className={cn(
                        'inline-block text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums',
                        marginTone(p.marginPercent),
                      )}
                    >
                      {p.marginPercent}%
                    </span>
                  </div>
                </div>
                <div className="sm:hidden text-right shrink-0 min-w-[5.5rem]">
                  <p className="text-[10px] text-gray-400 uppercase">Revenue</p>
                  <p className="text-xs font-bold text-gray-900 tabular-nums">{formatPrice(p.revenue)}</p>
                  <p className="text-[10px] text-emerald-600 uppercase mt-1">Profit</p>
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatPrice(p.profit)}</p>
                  <span
                    className={cn(
                      'inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded',
                      marginTone(p.marginPercent),
                    )}
                  >
                    {p.marginPercent}%
                  </span>
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 pt-0 bg-gradient-to-b from-gray-50/80 to-white border-t border-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-3">
                    <Detail label="Units sold" value={String(p.unitsSold)} />
                    <Detail label="Line revenue" value={formatPrice(p.revenue)} />
                    <Detail label="COGS" value={formatPrice(p.cogs)} />
                    <Detail label="Gross profit" value={formatPrice(p.profit)} highlight />
                    <Detail label="Avg sell price" value={formatPrice(p.avgSellPrice)} />
                    <Detail label="Avg unit cost" value={formatPrice(p.avgUnitCost)} />
                  </div>
                  {missingCost && (
                    <p className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {p.linesMissingCost} of {p.orderLines} lines missing cost — set variant cost in Inventory.
                    </p>
                  )}
                  <Link
                    href={`/admin/products`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Manage product <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', highlight && 'text-emerald-700')}>{value}</p>
    </div>
  );
}

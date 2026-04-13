'use client';

import { useEffect, useState, useMemo, useId, type ReactNode } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { MonthPoint } from '@/components/admin/MonthlyRevenueChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatAxisRupee(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

function formatCompactRupee(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return formatPrice(v);
}

type Row = { name?: string; tick?: string; revenue?: number; orders?: number };

function RevenueTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue');
  const ord = payload.find((p) => p.dataKey === 'orders');
  const revenueVal = typeof rev?.value === 'number' ? rev.value : 0;
  const orderVal = typeof ord?.value === 'number' ? ord.value : 0;
  const row = payload[0]?.payload as Row | undefined;
  const heading = row?.name ?? '';

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="text-emerald-600" aria-hidden>
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span>
          {heading} {formatCompactRupee(revenueVal)}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        gross · {orderVal} {orderVal === 1 ? 'order' : 'orders'}
      </p>
    </div>
  );
}

export function RevenueTrendAreaChart({
  data,
  height = 300,
  className,
  showOrdersLine = true,
  title,
  subtitle,
  titleRight,
  smooth = false,
}: {
  data: MonthPoint[];
  height?: number;
  className?: string;
  showOrdersLine?: boolean;
  title?: string;
  subtitle?: string;
  /** e.g. “Hover chart for details” aligned top-right */
  titleRight?: ReactNode;
  /** Smoother spline (“mountain”) curves — uses natural interpolation */
  smooth?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/:/g, '');
  const gradId = `adminRevFill-${uid}`;
  const strokeGradId = `adminRevStroke-${uid}`;

  useEffect(() => setMounted(true), []);

  const curve = smooth ? 'natural' : 'monotone';

  const chartData = useMemo(
    () =>
      data.map((d) => {
        const m = MONTHS[d._id.month - 1];
        const yy = String(d._id.year).slice(-2);
        return {
          name: `${m} ${d._id.year}`,
          tick: `${m}'${yy}`,
          revenue: d.revenue,
          orders: d.orders,
        };
      }),
    [data],
  );

  if (!mounted) {
    return (
      <div
        className={cn('w-full rounded-2xl bg-gradient-to-br from-rose-50/80 to-gray-50 animate-pulse', className)}
        style={{ height }}
      />
    );
  }

  if (!chartData.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500',
          className,
        )}
        style={{ height }}
      >
        No revenue data in this window yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle || titleRight) && (
        <div className="mb-4 flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            {title && (
              <h3 className="font-serif text-lg font-bold tracking-tight text-gray-900 md:text-xl">{title}</h3>
            )}
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-gray-500">{subtitle}</p>}
          </div>
          {titleRight ? <div className="shrink-0 pt-0.5 text-right">{titleRight}</div> : null}
        </div>
      )}
      <div className="flex w-full flex-col" style={{ height }}>
        <div className="min-h-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: showOrdersLine ? 4 : 10, left: 0, bottom: 4 }}
            >
              <defs>
                {/* Dark at top (near line) → light / clear at bottom */}
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#881337" stopOpacity={0.75} />
                  <stop offset="24%" stopColor="#e11d48" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#f472b6" stopOpacity={0.22} />
                  <stop offset="78%" stopColor="#fce7f3" stopOpacity={0.07} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#e7e5e4" vertical={false} strokeOpacity={0.95} />
              <XAxis
                dataKey="tick"
                tick={{ fill: '#78716c', fontSize: 10 }}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatAxisRupee}
                tick={{ fill: '#78716c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              {showOrdersLine && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#78716c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
              )}
              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ stroke: '#e11d48', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                yAxisId="left"
                type={curve as 'natural' | 'monotone'}
                dataKey="revenue"
                name="Gross (paid + refunded)"
                stroke={`url(#${strokeGradId})`}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 5, fill: '#be123c', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
              />
              {showOrdersLine && (
                <Line
                  yAxisId="right"
                  type={curve as 'natural' | 'monotone'}
                  dataKey="orders"
                  name="Order count"
                  stroke="#38bdf8"
                  strokeWidth={2.25}
                  dot={{ r: 3.5, fill: '#ffffff', stroke: '#38bdf8', strokeWidth: 2 }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#0ea5e9' }}
                  opacity={0.95}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-stone-100/90 pt-3 text-[11px] text-stone-600">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-5 rounded-sm bg-gradient-to-b from-rose-900 via-rose-500 to-white shadow-sm ring-1 ring-rose-200/60"
              aria-hidden
            />
            <span className="font-medium text-stone-700">Gross (paid + refunded)</span>
          </span>
          {showOrdersLine && (
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex h-3 w-7 items-center" aria-hidden>
                <span className="h-0.5 w-full rounded-full bg-sky-400" />
                <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400 bg-white shadow-sm" />
              </span>
              <span className="font-medium text-stone-700">Order count</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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
import { BarChart3 } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

type DayRow = { date: string; revenue: number; orders: number };

type ChartPoint = {
  date: string;
  tick: string;
  revenue: number;
  orders: number;
};

function formatTick(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatAxisRupee(v: number) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(Math.round(v));
}

function DailyTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue');
  const ord = payload.find((p) => p.dataKey === 'orders');
  const revenueVal = typeof rev?.value === 'number' ? rev.value : 0;
  const orderVal = typeof ord?.value === 'number' ? ord.value : 0;
  const row = payload[0]?.payload as ChartPoint | undefined;
  const heading = row?.date ?? '';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-blue-600" aria-hidden>
          <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span>{heading}</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-600">
        {formatPrice(revenueVal)} gross ·{' '}
        <span className="font-semibold text-blue-700 tabular-nums">{orderVal}</span>{' '}
        {orderVal === 1 ? 'order' : 'orders'}
      </p>
    </div>
  );
}

export function DailyOrdersRevenueChart({
  data,
  height = 320,
  className,
  title,
  subtitle,
  titleRight,
}: {
  data: DayRow[];
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  titleRight?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/:/g, '');
  const gradId = `dailyRevFill-${uid}`;
  const strokeGradId = `dailyRevStroke-${uid}`;

  useEffect(() => setMounted(true), []);

  const chartData = useMemo<ChartPoint[]>(
    () =>
      (data ?? []).map((d) => ({
        date: d.date,
        tick: formatTick(d.date),
        revenue: d.revenue,
        orders: d.orders,
      })),
    [data],
  );

  if (!mounted) {
    return (
      <div
        className={cn(
          'w-full rounded-2xl bg-gradient-to-br from-blue-50/90 to-slate-50 animate-pulse',
          className,
        )}
        style={{ height }}
      />
    );
  }

  if (!chartData.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500',
          className,
        )}
        style={{ height }}
      >
        No daily data yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle || titleRight) && (
        <div className="mb-4 flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            {title && (
              <h3 className="font-serif text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h3>
            )}
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
          </div>
          {titleRight ? <div className="shrink-0 pt-0.5 text-right">{titleRight}</div> : null}
        </div>
      )}
      <div className="flex w-full flex-col" style={{ height }}>
        <div className="min-h-0 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity={0.55} />
                  <stop offset="35%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="70%" stopColor="#93c5fd" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} strokeOpacity={0.95} />
              <XAxis
                dataKey="tick"
                tick={{ fill: '#64748b', fontSize: 9 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                minTickGap={28}
                angle={-28}
                textAnchor="end"
                height={52}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatAxisRupee}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                content={<DailyTooltip />}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={`url(#${strokeGradId})`}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#0ea5e9"
                strokeWidth={2.25}
                dot={{ r: 2.5, fill: '#fff', stroke: '#0ea5e9', strokeWidth: 2 }}
                activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#0284c7' }}
                opacity={0.95}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100/90 pt-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-5 rounded-sm bg-gradient-to-b from-blue-900 via-blue-500 to-white shadow-sm ring-1 ring-blue-200/60"
              aria-hidden
            />
            <span className="font-medium text-slate-700">Gross revenue (paid + refunded)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="relative inline-flex h-3 w-7 items-center" aria-hidden>
              <span className="h-0.5 w-full rounded-full bg-sky-500" />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-white shadow-sm" />
            </span>
            <span className="font-medium text-slate-700">Order count</span>
          </span>
        </div>
      </div>
    </div>
  );
}

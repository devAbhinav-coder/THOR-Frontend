'use client';

import { useEffect, useState, useMemo, useId, type ReactNode } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthPoint } from '@/components/admin/MonthlyRevenueChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Row = { name?: string; orders?: number };

function OrdersTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const o = payload.find((p) => p.dataKey === 'orders');
  const orderVal = typeof o?.value === 'number' ? o.value : 0;
  const row = payload[0]?.payload as Row | undefined;
  const heading = row?.name ?? '';

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="text-indigo-600" aria-hidden>
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span>
          {heading} · {orderVal} {orderVal === 1 ? 'order' : 'orders'}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">Monthly order volume</p>
    </div>
  );
}

export function OrdersVolumeTrendChart({
  data,
  height = 280,
  className,
  title,
  subtitle,
  titleRight,
}: {
  data: MonthPoint[];
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  titleRight?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/:/g, '');
  const gradId = `ordVolFill-${uid}`;
  const strokeGradId = `ordVolStroke-${uid}`;

  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () =>
      data.map((d) => {
        const m = MONTHS[d._id.month - 1];
        const yy = String(d._id.year).slice(-2);
        return {
          name: `${m} ${d._id.year}`,
          tick: `${m}'${yy}`,
          orders: d.orders,
        };
      }),
    [data],
  );

  if (!mounted) {
    return (
      <div
        className={cn('w-full rounded-2xl bg-gradient-to-br from-indigo-50/80 to-slate-50 animate-pulse', className)}
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
        No order history in this window yet
      </div>
    );
  }

  const maxOrders = Math.max(...chartData.map((d) => d.orders), 0);
  const yMax = Math.max(1, Math.ceil(Math.max(maxOrders, 1) * 1.12));

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
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
              <defs>
                {/* Top = dark / saturated, bottom = light / fade — classic area fill */}
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#312e81" stopOpacity={0.78} />
                  <stop offset="22%" stopColor="#4f46e5" stopOpacity={0.52} />
                  <stop offset="48%" stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="72%" stopColor="#bae6fd" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
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
                tickFormatter={(v) => (Number.isInteger(v) ? String(v) : '')}
                domain={[0, yMax]}
                tick={{ fill: '#78716c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip content={<OrdersTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="natural"
                dataKey="orders"
                name="Orders"
                stroke={`url(#${strokeGradId})`}
                strokeWidth={2.25}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-100/90 pt-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-5 rounded-sm bg-gradient-to-b from-indigo-900 via-indigo-400 to-white shadow-sm ring-1 ring-slate-200/80"
              aria-hidden
            />
            <span className="font-medium text-slate-700">Orders per month</span>
          </span>
        </div>
      </div>
    </div>
  );
}

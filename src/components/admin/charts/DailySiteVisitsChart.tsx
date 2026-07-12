'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { cn } from '@/lib/utils';

type DayRow = { date: string; visits: number };

function formatTick(dateStr: string) {
  const [, m, d] = dateStr.split('-').map(Number);
  if (!m || !d) return dateStr;
  return `${d}/${m}`;
}

function VisitsTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as DayRow;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-900">{row.date}</p>
      <p className="text-brand-700 tabular-nums">{row.visits} visits</p>
    </div>
  );
}

export function DailySiteVisitsChart({
  data,
  height = 160,
  className,
  title,
  subtitle,
}: {
  data: DayRow[];
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () =>
      data.map((r) => ({
        ...r,
        tick: formatTick(r.date),
      })),
    [data],
  );

  if (!mounted) {
    return <div className={cn('w-full rounded-lg bg-gray-50 animate-pulse', className)} style={{ height }} />;
  }

  if (!chartData.length) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-500', className)}
        style={{ height }}
      >
        No visit data yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-sm font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }} className="w-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="tick" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} width={28} />
            <Tooltip content={<VisitsTooltip />} cursor={{ fill: 'rgba(190,18,60,0.06)' }} />
            <Bar dataKey="visits" fill="#be123c" radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

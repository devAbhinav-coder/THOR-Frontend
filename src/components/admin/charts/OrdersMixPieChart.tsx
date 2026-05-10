'use client';

import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  processing: '#a855f7',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#9ca3af',
};

const FALLBACK = ['#2563eb', '#0ea5e9', '#6366f1', '#059669', '#7c3aed', '#64748b'];

type Row = { _id: string; count: number };

export function OrdersMixPieChart({
  data,
  totalOrders,
  height = 260,
  className,
  title,
  subtitle,
}: {
  data: Row[];
  totalOrders: number;
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        name: d._id.replace(/_/g, ' '),
        value: d.count,
        pct: totalOrders > 0 ? Math.round((d.count / totalOrders) * 1000) / 10 : 0,
        color: STATUS_COLORS[d._id] || FALLBACK[i % FALLBACK.length],
      })),
    [data, totalOrders],
  );

  if (!mounted) {
    return (
      <div
        className={cn('w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse', className)}
        style={{ height }}
      />
    );
  }

  if (!chartData.length) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500', className)}
        style={{ height }}
      >
        No orders yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle) && (
        <div className="mb-2 px-1">
          {title && <h3 className="font-serif text-lg font-bold text-gray-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }} className="w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="#fff"
              strokeWidth={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _n, props) => {
                const p = props?.payload as { pct?: number; name?: string };
                return [`${value} (${p?.pct ?? 0}%)`, p?.name ?? ''];
              }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 40px -10px rgba(15,23,42,0.2)',
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span className="capitalize text-gray-700">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

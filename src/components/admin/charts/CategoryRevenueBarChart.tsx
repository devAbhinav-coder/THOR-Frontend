'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatPrice, cn } from '@/lib/utils';

const BAR_COLORS = ['#c41230', '#2f3d75', '#f59e0b', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be185d'];

type Row = { _id: string; revenue: number; units: number };

export function CategoryRevenueBarChart({
  data,
  height = 280,
  className,
  title,
  subtitle,
}: {
  data: Row[];
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.revenue - a.revenue)
        .map((r) => ({
          name: r._id.length > 18 ? `${r._id.slice(0, 16)}…` : r._id,
          fullName: r._id,
          revenue: r.revenue,
          units: r.units,
        })),
    [data],
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
        No category revenue yet
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle) && (
        <div className="mb-4 px-1">
          {title && <h3 className="font-serif text-lg font-bold text-gray-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }} className="w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatAxisRupee(v)} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 40px -10px rgba(15,23,42,0.2)',
              }}
              formatter={(value: number, _n, item) => {
                const row = item?.payload as { fullName?: string; units?: number };
                const u = row?.units != null ? ` · ${row.units} units` : '';
                return [`${formatPrice(value)}${u}`, row?.fullName || 'Category'];
              }}
            />
            <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatAxisRupee(v: number) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(Math.round(v));
}

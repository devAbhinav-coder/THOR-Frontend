'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, cn } from '@/lib/utils';
import type { MonthPoint } from '@/components/admin/MonthlyRevenueChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatAxisRupee(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

export function RevenueTrendAreaChart({
  data,
  height = 300,
  className,
  showOrdersLine = true,
  title,
  subtitle,
}: {
  data: MonthPoint[];
  height?: number;
  className?: string;
  showOrdersLine?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: `${MONTHS[d._id.month - 1].slice(0, 3)} ${String(d._id.year).slice(-2)}`,
        revenue: d.revenue,
        orders: d.orders,
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
        No revenue data in this window yet
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
      <div style={{ height }} className="w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: showOrdersLine ? 8 : 12, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c41230" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#c41230" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatAxisRupee}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            {showOrdersLine && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
            )}
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 40px -10px rgba(15,23,42,0.2)',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              formatter={(value: number, name: string) => {
                const n = String(name).toLowerCase();
                if (n.includes('revenue')) return [formatPrice(value), 'Revenue'];
                if (n.includes('order')) return [value, 'Orders'];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
              formatter={(value) => (String(value).toLowerCase().includes('revenue') ? 'Revenue (paid)' : 'Orders')}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenue (paid)"
              stroke="#a00e27"
              strokeWidth={2.5}
              fill="url(#adminRevFill)"
              dot={{ r: 3, fill: '#c41230', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            {showOrdersLine && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#14192f"
                strokeWidth={2}
                dot={false}
                opacity={0.85}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState, useId } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { mergeMonthlyChartRows } from '@/lib/revenuePeriod';
import type { DashboardAnalytics } from '@/types';

function fmtAxis(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

type ChartRow = {
  name: string;
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  grossProfit: number;
  productRevenue: number;
  cogs: number;
  orders: number;
};

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow;
  if (!row) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-lg text-xs min-w-[200px]">
      <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1.5">{row.name}</p>
      <div className="space-y-1">
        <p className="flex justify-between gap-4">
          <span className="text-blue-700">Gross revenue</span>
          <span className="font-semibold tabular-nums">{formatPrice(row.grossRevenue)}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-red-600">Refunds</span>
          <span className="font-semibold tabular-nums">−{formatPrice(row.refunds)}</span>
        </p>
        <p className="flex justify-between gap-4 border-t border-gray-100 pt-1">
          <span className="text-navy-800 font-medium">Net revenue</span>
          <span className="font-bold tabular-nums text-navy-900">{formatPrice(row.netRevenue)}</span>
        </p>
        <p className="flex justify-between gap-4 pt-1">
          <span className="text-slate-600">Product revenue</span>
          <span className="tabular-nums">{formatPrice(row.productRevenue)}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-slate-500">COGS</span>
          <span className="tabular-nums">{formatPrice(row.cogs)}</span>
        </p>
        <p className="flex justify-between gap-4 border-t border-emerald-100 pt-1">
          <span className="text-emerald-700 font-semibold">Gross profit</span>
          <span className="font-bold tabular-nums text-emerald-800">{formatPrice(row.grossProfit)}</span>
        </p>
        <p className="text-[10px] text-gray-400 pt-0.5">{row.orders} orders</p>
      </div>
    </div>
  );
}

export default function RevenueVsProfitChart({
  revenueByMonth,
  profitByMonth,
  refundsByMonth,
  height = 340,
  chartTitle,
}: {
  revenueByMonth: DashboardAnalytics['revenueByMonth'];
  profitByMonth: DashboardAnalytics['profitByMonth'];
  refundsByMonth?: { _id: { year: number; month: number }; refunds: number }[];
  height?: number;
  chartTitle?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/:/g, '');

  useEffect(() => setMounted(true), []);

  const chartData = useMemo(
    () => mergeMonthlyChartRows(revenueByMonth, profitByMonth, refundsByMonth),
    [revenueByMonth, profitByMonth, refundsByMonth],
  );

  if (!mounted) {
    return <div className="w-full rounded-2xl bg-gray-100 animate-pulse" style={{ height }} />;
  }

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500"
        style={{ height }}
      >
        Not enough monthly data yet
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      {chartTitle && <p className="text-[10px] text-gray-400 mb-1 -mt-1">{chartTitle}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => <span className="text-gray-600">{value}</span>}
          />
          <Bar
            dataKey="grossRevenue"
            name="Gross revenue"
            fill={`url(#gross-${uid})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <Bar
            dataKey="netRevenue"
            name="Net revenue"
            fill="#14192f"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <Bar
            dataKey="productRevenue"
            name="Product revenue"
            fill="#d1ad68"
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <Line
            type="monotone"
            dataKey="grossProfit"
            name="Gross profit"
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
          />
          <defs>
            <linearGradient id={`gross-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5a059" />
              <stop offset="100%" stopColor="#e8d4a8" />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

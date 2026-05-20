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
import type { DashboardAnalytics } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtAxis(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as {
    name: string;
    grossRevenue: number;
    netRevenue: number;
    grossProfit: number;
    productRevenue: number;
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="font-bold text-gray-900 mb-2">{row.name}</p>
      <p className="text-blue-700">Gross revenue: {formatPrice(row.grossRevenue)}</p>
      <p className="text-navy-700">Net revenue: {formatPrice(row.netRevenue)}</p>
      <p className="text-gray-600">Product revenue: {formatPrice(row.productRevenue)}</p>
      <p className="text-emerald-700 font-semibold mt-1">Gross profit: {formatPrice(row.grossProfit)}</p>
    </div>
  );
}

export default function RevenueVsProfitChart({
  revenueByMonth,
  profitByMonth,
  height = 340,
}: {
  revenueByMonth: DashboardAnalytics['revenueByMonth'];
  profitByMonth: DashboardAnalytics['profitByMonth'];
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/:/g, '');

  useEffect(() => setMounted(true), []);

  const chartData = useMemo(() => {
    const profitMap = new Map(
      (profitByMonth ?? []).map((p) => [`${p._id.year}-${p._id.month}`, p]),
    );
    return revenueByMonth.map((d) => {
      const key = `${d._id.year}-${d._id.month}`;
      const profit = profitMap.get(key);
      const m = MONTHS[d._id.month - 1];
      const grossRevenue = d.revenue;
      return {
        name: `${m} ${String(d._id.year).slice(-2)}`,
        grossRevenue,
        netRevenue: grossRevenue,
        productRevenue: profit?.productRevenue ?? 0,
        grossProfit: profit?.grossProfit ?? 0,
        cogs: profit?.cogs ?? 0,
      };
    });
  }, [revenueByMonth, profitByMonth]);

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
            maxBarSize={28}
          />
          <Bar
            dataKey="productRevenue"
            name="Product revenue"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
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
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

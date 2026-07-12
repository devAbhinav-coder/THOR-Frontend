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
  Cell,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { DashboardAnalytics } from '@/types';

type Row = DashboardAnalytics['topViewedProducts'][number];

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as {
    name: string;
    views: number;
    sold: number;
    conversionPercent: number;
    revenue: number;
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs max-w-[220px]">
      <p className="font-semibold text-gray-900 leading-snug mb-1.5">{d.name}</p>
      <p className="text-blue-700">{d.views.toLocaleString()} views</p>
      <p className="text-emerald-700">{d.sold} units sold</p>
      <p className="text-gray-600">{d.conversionPercent}% conversion</p>
    </div>
  );
}

export default function ViewsConversionChart({ rows }: { rows: Row[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)
      .map((p) => ({
        name: p.name.length > 28 ? `${p.name.slice(0, 26)}…` : p.name,
        fullName: p.name,
        views: p.views,
        sold: p.sold,
        conversionPercent: p.conversionPercent,
        revenue: p.price * p.sold,
      }));
  }, [rows]);

  if (!mounted) {
    return <div className="h-[180px] rounded-lg bg-gray-50 animate-pulse" />;
  }

  if (!chartData.length) {
    return (
      <div className="h-[140px] flex items-center justify-center text-xs text-gray-500">
        No view data to chart yet
      </div>
    );
  }

  const maxConv = Math.max(...chartData.map((d) => d.conversionPercent), 1);

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 9, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
          <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]} maxBarSize={14}>
            {chartData.map((entry, i) => (
              <Cell
                key={`v-${i}`}
                fill={
                  entry.conversionPercent >= maxConv * 0.7 ? '#2563eb'
                  : entry.conversionPercent > 0 ? '#60a5fa'
                  : '#cbd5e1'
                }
              />
            ))}
          </Bar>
          <Bar dataKey="sold" name="Units sold" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 text-center mt-2">
        Blue intensity ≈ conversion strength · Green = units sold
      </p>
    </div>
  );
}

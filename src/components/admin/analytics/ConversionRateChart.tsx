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
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { DashboardAnalytics } from '@/types';

type Row = DashboardAnalytics['topViewedProducts'][number];

export default function ConversionRateChart({
  rows,
  avgConversion,
}: {
  rows: Row[];
  avgConversion: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.conversionPercent - a.conversionPercent)
        .slice(0, 10)
        .map((p) => ({
          name: p.name.length > 16 ? `${p.name.slice(0, 14)}…` : p.name,
          conversion: p.conversionPercent,
          views: p.views,
        })),
    [rows],
  );

  if (!mounted) return <div className="h-[240px] bg-gray-50 animate-pulse rounded-xl" />;
  if (!data.length) return null;

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 8, fill: '#64748b', angle: -35, textAnchor: 'end' }}
            height={56}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={({ active, payload }: TooltipProps<number, string>) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { name: string; conversion: number; views: number };
              return (
                <div className="rounded-lg border bg-white px-2.5 py-2 text-xs shadow-md">
                  <p className="font-semibold">{d.name}</p>
                  <p>{d.conversion}% conversion</p>
                  <p className="text-gray-500">{d.views} views</p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={avgConversion}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: `Avg ${avgConversion}%`, position: 'right', fontSize: 10, fill: '#b45309' }}
          />
          <Bar dataKey="conversion" name="Conversion %" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

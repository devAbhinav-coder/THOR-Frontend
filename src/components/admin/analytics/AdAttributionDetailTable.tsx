"use client";

import { Megaphone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

type Row = NonNullable<
  DashboardAnalytics["marketingInsights"]
>["adAttributionRows"];

export default function AdAttributionDetailTable({
  rows,
}: {
  rows?: Row;
}) {
  const data = rows ?? [];
  if (data.length === 0) return null;

  return (
    <div className='rounded-lg border border-gray-100 bg-white p-2.5 overflow-hidden'>
      <div className='flex items-center gap-1.5 mb-2'>
        <Megaphone className='h-3.5 w-3.5 text-brand-600' />
        <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500'>
          Ad attribution detail
        </h4>
      </div>
      <p className='text-[10px] text-gray-500 mb-2 leading-relaxed'>
        Sessions with matching UTM or Meta click id; orders with the same
        attribution at checkout. Last 30 days.
      </p>
      <div className='overflow-x-auto max-h-[280px] overflow-y-auto'>
        <table className='w-full text-[10px]'>
          <thead className='sticky top-0 bg-white'>
            <tr className='text-gray-400 border-b border-gray-100'>
              <th className='text-left py-1 pr-2 font-semibold'>Source</th>
              <th className='text-left py-1 pr-2 font-semibold'>Medium</th>
              <th className='text-left py-1 pr-2 font-semibold'>Campaign</th>
              <th className='text-right py-1 pr-2 font-semibold'>Visits</th>
              <th className='text-right py-1 pr-2 font-semibold'>Meta clicks</th>
              <th className='text-right py-1 pr-2 font-semibold'>Orders</th>
              <th className='text-right py-1 pr-2 font-semibold'>Revenue</th>
              <th className='text-right py-1 font-semibold'>Conv. %</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-50'>
            {data.map((r) => {
              const key = `${r.source}-${r.medium}-${r.campaign}-${r.term}-${r.content}`;
              return (
                <tr key={key} className='text-gray-700'>
                  <td className='py-1.5 pr-2 truncate max-w-[80px]' title={r.source}>
                    {r.source}
                  </td>
                  <td className='py-1.5 pr-2 truncate max-w-[72px]' title={r.medium}>
                    {r.medium}
                  </td>
                  <td
                    className='py-1.5 pr-2 truncate max-w-[100px]'
                    title={[r.campaign, r.content, r.term].filter(Boolean).join(" · ")}
                  >
                    {r.campaign}
                  </td>
                  <td className='py-1.5 pr-2 text-right tabular-nums font-medium'>
                    {r.visits}
                  </td>
                  <td className='py-1.5 pr-2 text-right tabular-nums'>
                    {r.metaClicks}
                  </td>
                  <td className='py-1.5 pr-2 text-right tabular-nums font-bold'>
                    {r.orders}
                  </td>
                  <td className='py-1.5 pr-2 text-right tabular-nums font-bold text-emerald-700'>
                    {formatPrice(r.revenue)}
                  </td>
                  <td className='py-1.5 text-right tabular-nums text-gray-500'>
                    {r.visits > 0 || r.orders > 0 ?
                      `${r.visitToOrderPercent}%`
                    : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

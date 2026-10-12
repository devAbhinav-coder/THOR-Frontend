"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Clock,
  MousePointerClick,
  Megaphone,
  Layers,
  ScrollText,
} from "lucide-react";
import type { DashboardAnalytics } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { formatDurationMs } from "@/lib/formatDuration";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";
import { adminProductStoreHref } from "@/lib/adminProductStoreLink";

type Engagement = DashboardAnalytics["engagementInsights"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_COLORS = ["#c5a059", "#14192f", "#2f3d75", "#5f6dad", "#dbbc7c"];

function EngagementHeatmap({
  cells,
}: {
  cells: { dayIndex: number; hour: number; totalMs: number }[];
}) {
  const map = new Map<string, number>();
  let max = 0;
  for (const c of cells) {
    const k = `${c.dayIndex}-${c.hour}`;
    map.set(k, (map.get(k) ?? 0) + c.totalMs);
    max = Math.max(max, map.get(k) ?? 0);
  }
  if (max <= 0) {
    return (
      <p className='text-xs text-gray-500 py-8 text-center'>
        Time-on-site heatmap fills in as page engagement is recorded.
      </p>
    );
  }
  function tone(v: number): string {
    if (v <= 0) return "bg-gray-50";
    const r = v / max;
    if (r >= 0.75) return "bg-navy-800";
    if (r >= 0.5) return "bg-brand-600";
    if (r >= 0.3) return "bg-brand-400";
    return "bg-brand-200";
  }
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[520px]'>
        <div
          className='grid gap-0.5'
          style={{ gridTemplateColumns: "48px repeat(24, minmax(0, 1fr))" }}
        >
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={`h-${h}`}
              className='text-[7px] text-gray-400 text-center tabular-nums'
            >
              {h % 4 === 0 ? h : ""}
            </div>
          ))}
          {WEEKDAYS.map((label, dayIndex) => (
            <div key={`row-${dayIndex}`} className='contents'>
              <div className='text-[9px] font-medium text-gray-500 flex items-center'>
                {label}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const v = map.get(`${dayIndex}-${hour}`) ?? 0;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`h-3 rounded-sm ${tone(v)}`}
                    title={`${label} ${hour}:00 · ${formatDurationMs(v)} total`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EngagementAnalyticsSection({
  engagement,
}: {
  engagement?: Engagement;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const page = engagement?.pageEngagement;
  const meta = engagement?.metaEvents;
  const ga = engagement?.gaEvents;

  const pageChartData = useMemo(
    () =>
      (page?.timeByPage ?? []).map((r) => ({
        name: r.page.length > 16 ? `${r.page.slice(0, 14)}…` : r.page,
        fullName: r.page,
        avgSec: Math.round(r.avgMs / 1000),
        views: r.views,
      })),
    [page?.timeByPage],
  );

  const metaChartData = useMemo(
    () => meta?.byEventName ?? [],
    [meta?.byEventName],
  );

  const gaChartData = useMemo(
    () => ga?.byEventName ?? [],
    [ga?.byEventName],
  );

  if (!engagement) {
    return (
      <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center'>
        <Clock className='h-8 w-8 text-gray-300 mx-auto mb-2' />
        <p className='text-sm font-medium text-gray-700'>
          Engagement analytics loading…
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <AnalyticsSectionHeader
        title='Time on page, Meta & GA4 mirror'
        description='Measured dwell, scroll depth, Meta Pixel/CAPI and GA4 ecommerce events stored first-party in admin — last 30 days · IST.'
      />

      <div className='grid grid-cols-2 lg:grid-cols-5 gap-2'>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Page views timed
          </p>
          <p className='text-2xl font-bold tabular-nums text-navy-900 mt-1'>
            {(page?.totals.views ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Total time on site
          </p>
          <p className='text-2xl font-bold tabular-nums text-navy-900 mt-1'>
            {formatDurationMs(page?.totals.totalMs ?? 0)}
          </p>
        </div>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Meta events (mirror)
          </p>
          <p className='text-2xl font-bold tabular-nums text-navy-900 mt-1'>
            {(meta?.totalEvents ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            GA4 events (mirror)
          </p>
          <p className='text-2xl font-bold tabular-nums text-navy-900 mt-1'>
            {(ga?.totalEvents ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Unified feed rows
          </p>
          <p className='text-2xl font-bold tabular-nums text-navy-900 mt-1'>
            {(engagement.unifiedFeed?.length ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <Clock className='h-4 w-4 text-brand-600' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Avg time per page (seconds)
            </h3>
          </div>
          {!mounted || pageChartData.length === 0 ?
            <p className='text-xs text-gray-500 py-10 text-center'>
              Browse a few pages on the store — averages appear here.
            </p>
          : <ResponsiveContainer width='100%' height={260}>
              <BarChart data={pageChartData} layout='vertical' margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                <XAxis type='number' unit='s' tick={{ fontSize: 10 }} />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={88}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}s avg`, "Time"]}
                  labelFormatter={(_, p) =>
                    p?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Bar dataKey='avgSec' radius={[0, 4, 4, 0]}>
                  {pageChartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <Megaphone className='h-4 w-4 text-indigo-600' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Meta events (first-party copy)
            </h3>
          </div>
          {!mounted || metaChartData.length === 0 ?
            <p className='text-xs text-gray-500 py-10 text-center'>
              Pixel/CAPI relay events appear here (PageView, ViewContent, AddToCart…).
            </p>
          : <ResponsiveContainer width='100%' height={260}>
              <BarChart data={metaChartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='count' fill='#14192f' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <ScrollText className='h-4 w-4 text-violet-600' />
            <h3 className='text-sm font-semibold text-navy-900'>
              GA4 events (first-party copy)
            </h3>
          </div>
          {!mounted || gaChartData.length === 0 ?
            <p className='text-xs text-gray-500 py-10 text-center'>
              view_item, add_to_cart, purchase… mirrored when shoppers use the
              store.
            </p>
          : <ResponsiveContainer width='100%' height={260}>
              <BarChart data={gaChartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='count' fill='#6d28d9' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
        <div className='flex items-center gap-2 mb-2'>
          <MousePointerClick className='h-4 w-4 text-navy-800' />
          <h3 className='text-sm font-semibold text-navy-900'>
            When shoppers spend time (IST heatmap)
          </h3>
        </div>
        <EngagementHeatmap cells={page?.engagementHeatmap ?? []} />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Layers className='h-4 w-4 text-emerald-600' />
            <h3 className='text-sm font-bold text-gray-900'>
              Products · dwell time
            </h3>
          </div>
          <p className='text-[10px] text-gray-500 mb-2'>
            Which PDP they studied longest before leaving or buying.
          </p>
          {!page?.topProductDwell?.length ?
            <p className='text-xs text-gray-500 py-6 text-center'>No PDP timing yet</p>
          : <ul className='space-y-2'>
              {page.topProductDwell.map((p) => (
                <li
                  key={p.slug}
                  className='flex justify-between gap-2 text-[11px] border-b border-gray-50 pb-1.5'
                >
                  <Link
                    href={adminProductStoreHref({
                      slug: p.slug,
                      isPremium: p.catalog === "premium",
                    })}
                    className='text-brand-700 hover:underline truncate'
                  >
                    {p.name}
                  </Link>
                  <span className='shrink-0 tabular-nums text-gray-800 font-semibold'>
                    {formatDurationMs(p.avgMs)} avg · {p.views} views
                    {p.avgScrollPct != null ?
                      ` · scroll ${p.avgScrollPct}%`
                    : ""}
                  </span>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <ScrollText className='h-4 w-4 text-amber-600' />
            <h3 className='text-sm font-bold text-gray-900'>Scroll depth</h3>
          </div>
          {!page?.scrollDepthByPage?.length ?
            <p className='text-xs text-gray-500 py-6 text-center'>
              Max scroll % recorded when shoppers leave each page type.
            </p>
          : <ul className='space-y-1.5'>
              {page.scrollDepthByPage.map((r) => (
                <li key={r.page} className='text-[11px]'>
                  <div className='flex justify-between mb-0.5'>
                    <span className='text-gray-700 truncate'>{r.page}</span>
                    <span className='font-bold tabular-nums'>
                      {r.avgScrollPct}%
                    </span>
                  </div>
                  <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-brand-500 rounded-full'
                      style={{ width: `${r.avgScrollPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
        <h3 className='text-sm font-bold text-gray-900 mb-2'>
          Unified activity stream
        </h3>
        <p className='text-[10px] text-gray-500 mb-3'>
          Commerce + page time + Meta + GA4 mirror — newest first.
        </p>
        {!engagement.unifiedFeed?.length ?
          <p className='text-xs text-gray-500 py-6 text-center'>
            Stream populates as the store is used.
          </p>
        : <div className='overflow-x-auto'>
            <table className='w-full text-[10px]'>
              <thead>
                <tr className='text-left text-gray-400 border-b border-gray-100'>
                  <th className='py-1.5 pr-2'>When</th>
                  <th className='py-1.5 pr-2'>Source</th>
                  <th className='py-1.5 pr-2'>Event</th>
                  <th className='py-1.5 pr-2'>Detail</th>
                  <th className='py-1.5'>User</th>
                </tr>
              </thead>
              <tbody>
                {engagement.unifiedFeed.slice(0, 25).map((row, i) => (
                  <tr key={`${row.at}-${i}`} className='border-b border-gray-50'>
                    <td className='py-1.5 pr-2 tabular-nums text-gray-500 whitespace-nowrap'>
                      {formatDateTime(String(row.at))}
                    </td>
                    <td className='py-1.5 pr-2 capitalize text-gray-600'>
                      {row.source}
                    </td>
                    <td className='py-1.5 pr-2 font-medium text-gray-800'>
                      {row.label}
                    </td>
                    <td className='py-1.5 pr-2 text-gray-600 truncate max-w-[180px]'>
                      {row.detail}
                    </td>
                    <td className='py-1.5 text-gray-500'>
                      {row.userId ?
                        <Link
                          href={`/admin/users?highlight=${encodeURIComponent(row.userId)}`}
                          className='text-brand-700 hover:underline'
                        >
                          …{row.userId.slice(-6)}
                        </Link>
                      : "Guest"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}

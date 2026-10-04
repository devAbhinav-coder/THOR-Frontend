"use client";

import { Globe2, MapPin, Clock, MousePointerClick, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";
import VisitInsightsPanel from "./VisitInsightsPanel";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";

type Insights = NonNullable<DashboardAnalytics["visitInsights"]>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function VisitHourBars({ data }: { data: { hour: number; visits: number }[] }) {
  const total = data.reduce((s, h) => s + h.visits, 0);
  if (total === 0) {
    return (
      <p className='text-xs text-gray-500 py-6 text-center'>
        Visit timing appears once traffic is recorded (last 30 days · IST).
      </p>
    );
  }
  const max = Math.max(...data.map((h) => h.visits), 1);
  const peak = data.reduce(
    (best, h) => (h.visits > best.visits ? h : best),
    data[0],
  );
  const BAR = 64;

  return (
    <div className='space-y-2'>
      <p className='text-[10px] text-gray-500'>
        Peak browsing:{" "}
        <span className='font-bold text-gray-800'>
          {peak.hour}:00 IST · {peak.visits} sessions
        </span>
      </p>
      <div
        className='grid gap-0.5 items-end'
        style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
      >
        {data.map((h) => {
          const px =
            h.visits > 0 ?
              Math.max(4, Math.round((h.visits / max) * BAR))
            : 2;
          return (
            <div key={h.hour} className='flex flex-col items-center gap-0.5'>
              <div
                className='w-full flex items-end justify-center'
                style={{ height: BAR }}
              >
                <div
                  className={`w-[85%] max-w-[14px] rounded-t-sm ${
                    h.hour === peak.hour && h.visits > 0 ?
                      "bg-navy-800"
                    : h.visits > 0 ?
                      "bg-brand-400"
                    : "bg-gray-200"
                  }`}
                  style={{ height: px }}
                  title={`${h.hour}:00 · ${h.visits} visits`}
                />
              </div>
              <span className='text-[7px] text-gray-400 tabular-nums'>
                {h.hour % 6 === 0 ? h.hour : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VisitWeekHourHeatmap({
  cells,
}: {
  cells: { dayIndex: number; hour: number; visits: number }[];
}) {
  const map = new Map<string, number>();
  let max = 0;
  for (const c of cells) {
    const k = `${c.dayIndex}-${c.hour}`;
    map.set(k, (map.get(k) ?? 0) + c.visits);
    max = Math.max(max, (map.get(k) ?? 0) + c.visits);
  }
  if (max === 0) {
    return (
      <p className='text-xs text-gray-500 py-6 text-center'>
        Weekly heatmap fills in as sessions accumulate.
      </p>
    );
  }

  function tone(v: number): string {
    if (v <= 0) return "bg-gray-50";
    const r = v / max;
    if (r >= 0.75) return "bg-navy-800";
    if (r >= 0.5) return "bg-brand-600";
    if (r >= 0.3) return "bg-brand-400";
    if (r >= 0.15) return "bg-brand-200";
    return "bg-brand-50";
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[520px] border-separate border-spacing-0.5 text-[9px]'>
        <thead>
          <tr>
            <th className='text-left text-gray-400 font-semibold pr-1 w-8' />
            {Array.from({ length: 24 }, (_, h) => (
              <th
                key={h}
                className='text-center text-gray-300 font-normal px-0 tabular-nums'
              >
                {h % 4 === 0 ? h : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKDAYS.map((label, dayIndex) => (
            <tr key={label}>
              <td className='text-gray-500 font-semibold pr-1 py-0.5'>{label}</td>
              {Array.from({ length: 24 }, (_, hour) => {
                const v = map.get(`${dayIndex}-${hour}`) ?? 0;
                return (
                  <td key={hour} className='p-0'>
                    <div
                      className={`h-3.5 w-full rounded-[2px] ${tone(v)}`}
                      title={`${label} ${hour}:00 IST · ${v} visits`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className='text-[9px] text-gray-400 mt-2'>
        Darker = more unique sessions · last 30 days · Asia/Kolkata
      </p>
    </div>
  );
}

export default function TrafficAnalyticsSection({
  insights,
}: {
  insights?: Insights;
}) {
  if (!insights) return null;

  const india = insights.byIndiaRegion ?? [];
  const topPages = insights.topPagesByViews ?? [];
  const recentPages = insights.recentPageViews ?? [];
  const visitsByHour = insights.visitsByHour ?? [];
  const heatmap = insights.visitHeatmap ?? [];

  return (
    <div className='space-y-5'>
      <VisitInsightsPanel insights={insights} />

      <AnalyticsSectionHeader
        title='Geography & on-site behaviour'
        description='India breakdown, top paths, and when visitors browse (IST).'
      />

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Globe2 className='h-4 w-4 text-navy-700' />
            <div>
              <h3 className='text-sm font-semibold text-navy-900'>
                Visitors by country
              </h3>
              <p className='text-[10px] text-gray-500'>
                Edge geo on session start · last 30 days
              </p>
            </div>
          </div>
          {(insights.byCountry ?? []).length === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              Country appears once sessions are recorded behind Vercel or
              Cloudflare.
            </p>
          : <ul className='space-y-1.5 max-h-[220px] overflow-y-auto pr-1'>
              {(insights.byCountry ?? []).map((row) => {
                const max = insights.byCountry[0]?.visits ?? 1;
                return (
                  <li key={row.code ?? row.label}>
                    <div className='flex justify-between text-[11px] mb-0.5'>
                      <span className='text-gray-700 truncate pr-2'>
                        {row.label}
                      </span>
                      <span className='font-bold tabular-nums shrink-0'>
                        {row.visits}
                      </span>
                    </div>
                    <div className='h-1 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-navy-700 rounded-full'
                        style={{
                          width: `${(row.visits / max) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          }
        </div>

        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Globe2 className='h-4 w-4 text-brand-600' />
            <div>
              <h3 className='text-sm font-semibold text-navy-900'>
                India · state &amp; city
              </h3>
              <p className='text-[10px] text-gray-500'>
                Sessions with country IN · city/region from CDN headers
              </p>
            </div>
          </div>
          {india.length === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              No India sessions in this window, or geo headers were missing at
              visit time.
            </p>
          : <ul className='space-y-1.5 max-h-[220px] overflow-y-auto pr-1'>
              {india.map((row) => {
                const max = india[0]?.visits ?? 1;
                return (
                  <li key={row.label}>
                    <div className='flex justify-between text-[11px] mb-0.5'>
                      <span className='text-gray-700 truncate pr-2'>
                        {row.label}
                      </span>
                      <span className='font-bold tabular-nums shrink-0'>
                        {row.visits}
                      </span>
                    </div>
                    <div className='h-1 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-emerald-500 rounded-full'
                        style={{
                          width: `${(row.visits / max) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          }
          {india.some((r) => r.label.includes("Region not reported")) ?
            <p className='text-[10px] text-gray-400 mt-2 leading-relaxed'>
              &quot;Region not reported&quot; = India detected but CDN did not
              send city/state when that session was saved. New visits on
              Vercel/Cloudflare usually include city + region code.
            </p>
          : null}
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <MapPin className='h-4 w-4 text-navy-700' />
            <div>
              <h3 className='text-sm font-semibold text-navy-900'>
                Top pages
              </h3>
              <p className='text-[10px] text-gray-500'>
                Page views on route change · last 30 days
              </p>
            </div>
          </div>
          {topPages.length === 0 ?
            <p className='text-xs text-gray-500 py-4 text-center'>
              Page paths will appear after shoppers browse multiple screens.
            </p>
          : <div className='overflow-x-auto max-h-[220px] overflow-y-auto'>
              <table className='w-full text-[10px]'>
                <thead>
                  <tr className='text-gray-400 border-b border-gray-50'>
                    <th className='text-left py-1 font-semibold'>Path</th>
                    <th className='text-right py-1 font-semibold w-16'>
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {topPages.map((p) => (
                    <tr key={p.rawPath}>
                      <td className='py-1.5 text-gray-700 font-mono truncate max-w-[240px]'>
                        {p.path}
                      </td>
                      <td className='py-1.5 text-right font-bold tabular-nums'>
                        {p.views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Clock className='h-4 w-4 text-brand-600' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Visits by hour (IST)
            </h3>
          </div>
          <VisitHourBars data={visitsByHour} />
        </div>
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <Clock className='h-4 w-4 text-navy-700' />
            <h3 className='text-sm font-semibold text-navy-900'>
              Week × hour heatmap
            </h3>
          </div>
          <VisitWeekHourHeatmap cells={heatmap} />
        </div>
      </div>

      {recentPages.length > 0 && (
        <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-2'>
            <MousePointerClick className='h-4 w-4 text-brand-600' />
            <div>
              <h3 className='text-sm font-semibold text-navy-900'>
                Live page activity
              </h3>
              <p className='text-[10px] text-gray-500'>
                Latest route views · guest or signed-in shopper
              </p>
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-[10px]'>
              <thead>
                <tr className='text-gray-400 border-b border-gray-50'>
                  <th className='text-left py-1 pr-2'>When</th>
                  <th className='text-left py-1 pr-2'>Page</th>
                  <th className='text-left py-1 pr-2'>
                    <Users className='h-3 w-3 inline' /> User
                  </th>
                  <th className='text-left py-1 pr-2'>Region</th>
                  <th className='text-left py-1 pr-2'>Source</th>
                  <th className='text-left py-1'>Ad tag</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {recentPages.map((row, i) => (
                  <tr key={`${String(row.at)}-${i}`} className='text-gray-700'>
                    <td className='py-1.5 pr-2 whitespace-nowrap text-gray-500'>
                      {formatDateTime(String(row.at))}
                    </td>
                    <td className='py-1.5 pr-2 font-mono truncate max-w-[140px]'>
                      {row.path}
                    </td>
                    <td className='py-1.5 pr-2'>{row.userLabel}</td>
                    <td className='py-1.5 pr-2 truncate max-w-[100px]'>
                      {row.region || row.country}
                    </td>
                    <td className='py-1.5 pr-2'>{row.source}</td>
                    <td className='py-1.5 truncate max-w-[100px]'>
                      {row.campaign ?
                        `${row.campaign}${row.medium ? ` · ${row.medium}` : ""}`
                      : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

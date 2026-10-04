"use client";

import { Globe, Link2, MonitorSmartphone, MapPin, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { DashboardAnalytics } from "@/types";

type Insights = NonNullable<DashboardAnalytics["visitInsights"]>;

const CHANNEL_SHORT: Record<string, string> = {
  meta_paid_ad: "Meta ad",
  instagram_link_in_bio: "Link in bio",
  meta_ads_utm: "Meta UTM",
  other_utm: "Other UTM",
};

function BreakdownList({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Globe;
  rows: { label: string; visits: number }[];
}) {
  if (!rows.length) {
    return (
      <div className='rounded-lg border border-dashed border-gray-200 p-3 text-[10px] text-gray-400 text-center'>
        No data yet
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.visits), 1);
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-2.5'>
      <div className='flex items-center gap-1.5 mb-2'>
        <Icon className='h-3.5 w-3.5 text-brand-600' />
        <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500'>
          {title}
        </h4>
      </div>
      <ul className='space-y-1.5'>
        {rows.map((row, index) => (
          <li key={`${title}-${index}-${row.label}`}>
            <div className='flex justify-between gap-2 text-[11px] mb-0.5'>
              <span className='text-gray-700 truncate'>{row.label}</span>
              <span className='font-bold tabular-nums text-gray-900 shrink-0'>
                {row.visits}
              </span>
            </div>
            <div className='h-1 bg-gray-100 rounded-full overflow-hidden'>
              <div
                className='h-full bg-brand-500 rounded-full'
                style={{ width: `${(row.visits / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VisitInsightsPanel({
  insights,
}: {
  insights?: Insights;
}) {
  if (!insights) return null;

  const hasAny =
    insights.byCountry.length > 0 ||
    insights.bySource.length > 0 ||
    insights.recent.length > 0;

  if (!hasAny) {
    return (
      <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-center'>
        <Globe className='h-6 w-6 text-gray-300 mx-auto mb-1.5' />
        <p className='text-xs text-gray-600 font-medium'>
          Visit breakdown builds as traffic comes in
        </p>
        <p className='text-[10px] text-gray-400 mt-1'>
          Region from CDN · source from referrer · last 30 days
        </p>
      </div>
    );
  }

  const deviceRows = insights.byDevice.map((d) => ({
    label:
      d.device === "mobile" ? "Mobile"
      : d.device === "tablet" ? "Tablet"
      : "Desktop",
    visits: d.visits,
  }));

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h3 className='text-sm font-semibold text-navy-900 tracking-tight'>
            Audience &amp; referrers
          </h3>
          <p className='text-xs text-gray-500 mt-0.5'>
            Last 30 days · geography from edge headers · referrer is not UTM
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2'>
        <BreakdownList
          title='Region'
          icon={Globe}
          rows={insights.byCountry.map((c) => ({
            label: c.label,
            visits: c.visits,
          }))}
        />
        <BreakdownList
          title='Referrer'
          icon={Link2}
          rows={insights.bySource.map((s) => ({
            label: s.source,
            visits: s.visits,
          }))}
        />
        <BreakdownList
          title='Device'
          icon={MonitorSmartphone}
          rows={deviceRows}
        />
        <BreakdownList
          title='Landing page'
          icon={MapPin}
          rows={insights.byLandingPage.map((p) => ({
            label: p.page,
            visits: p.visits,
          }))}
        />
      </div>

      {insights.recent.length > 0 && (
        <div className='rounded-lg border border-gray-100 bg-white p-2.5'>
          <div className='flex items-center gap-1.5 mb-2'>
            <Clock className='h-3.5 w-3.5 text-navy-700' />
            <div>
              <h4 className='text-[10px] font-bold uppercase tracking-wide text-gray-500'>
                Recent sessions
              </h4>
              <p className='text-[10px] text-gray-500 mt-0.5 max-w-2xl leading-relaxed'>
                One row per browser tab per IST calendar day (first landing).
                Referrer differs from UTM tags. Per-route activity is in{" "}
                <span className='font-medium text-gray-700'>
                  Live page activity
                </span>{" "}
                below.
              </p>
            </div>
          </div>
          <div className='overflow-x-auto max-h-[320px] overflow-y-auto'>
            <table className='w-full text-[10px] min-w-[720px]'>
              <thead className='sticky top-0 bg-white z-10'>
                <tr className='text-gray-400 border-b border-gray-100'>
                  <th className='text-left font-semibold py-1 pr-2'>When</th>
                  <th className='text-left font-semibold py-1 pr-2'>Region</th>
                  <th className='text-left font-semibold py-1 pr-2'>
                    Referrer
                  </th>
                  <th className='text-left font-semibold py-1 pr-2'>
                    UTM source / medium
                  </th>
                  <th className='text-left font-semibold py-1 pr-2'>
                    Campaign / content
                  </th>
                  <th className='text-left font-semibold py-1 pr-2'>Bucket</th>
                  <th className='text-left font-semibold py-1 pr-2'>Landing</th>
                  <th className='text-left font-semibold py-1'>Device</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {insights.recent.map((v, i) => {
                  const utmLine = [v.utmSource, v.utmMedium]
                    .filter(Boolean)
                    .join(" · ");
                  const campLine =
                    v.utmCampaign ||
                    v.utmContent ||
                    v.campaign ||
                    "";
                  const tagged = Boolean(
                    v.marketingChannel ||
                      v.hasFbclid ||
                      v.utmSource ||
                      v.utmMedium ||
                      v.utmCampaign ||
                      v.utmContent,
                  );
                  return (
                    <tr key={`${v.at}-${i}`} className='text-gray-700'>
                      <td className='py-1.5 pr-2 tabular-nums whitespace-nowrap text-gray-500'>
                        {formatDateTime(String(v.at))}
                      </td>
                      <td className='py-1.5 pr-2'>
                        <span className='font-medium text-gray-800'>
                          {v.country}
                        </span>
                        {v.region ?
                          <span className='block text-[9px] text-gray-400 truncate max-w-[100px]'>
                            {v.region}
                          </span>
                        : null}
                      </td>
                      <td className='py-1.5 pr-2 whitespace-nowrap'>
                        {v.source}
                      </td>
                      <td
                        className='py-1.5 pr-2 truncate max-w-[110px]'
                        title={utmLine || undefined}
                      >
                        {utmLine || (tagged ? "" : "—")}
                        {!utmLine && !tagged ?
                          <span className='text-gray-400'>No tag</span>
                        : null}
                      </td>
                      <td
                        className='py-1.5 pr-2 truncate max-w-[120px]'
                        title={campLine || undefined}
                      >
                        {campLine || "—"}
                        {v.hasFbclid ?
                          <span className='block text-[9px] text-navy-700 font-semibold'>
                            fbclid ✓
                          </span>
                        : null}
                      </td>
                      <td className='py-1.5 pr-2 whitespace-nowrap'>
                        {v.marketingChannel ?
                          <span
                            className={`inline-flex rounded px-1 py-0.5 text-[9px] font-bold ${
                              v.marketingChannel === "instagram_link_in_bio" ?
                                "bg-pink-50 text-pink-800"
                              : v.marketingChannel === "meta_paid_ad" ?
                                "bg-navy-100 text-navy-900"
                              : "bg-brand-50 text-brand-900"
                            }`}
                          >
                            {CHANNEL_SHORT[v.marketingChannel] ??
                              v.marketingChannel}
                          </span>
                        : tagged ?
                          <span className='text-gray-500 text-[9px]'>Tagged</span>
                        : "—"}
                      </td>
                      <td
                        className='py-1.5 pr-2 truncate max-w-[90px]'
                        title={v.landingPath || v.page}
                      >
                        {v.page}
                      </td>
                      <td className='py-1.5 capitalize'>{v.device}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

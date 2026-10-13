"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertCircle,
  BarChart3,
  IndianRupee,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import type { DashboardAnalytics } from "@/types";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AnalyticsSectionHeader from "./AnalyticsSectionHeader";

type Ga4Data = NonNullable<DashboardAnalytics["ga4Reporting"]>;

function formatGaDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}`;
}

export default function Ga4ReportingSection({
  initial,
}: {
  initial?: Ga4Data;
}) {
  const [data, setData] = useState<Ga4Data | undefined>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGa4Reporting();
      setData(res.data as Ga4Data);
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }, []);

  const dailyChart = useMemo(
    () =>
      (data?.daily ?? []).map((d) => ({
        ...d,
        label: formatGaDate(d.date),
      })),
    [data?.daily],
  );

  if (!data) {
    return (
      <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center'>
        <BarChart3 className='h-8 w-8 text-gray-300 mx-auto mb-2' />
        <p className='text-sm text-gray-600'>GA4 reporting loading…</p>
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className='rounded-xl border border-amber-200 bg-amber-50/80 p-5 space-y-2'>
        <AnalyticsSectionHeader
          title='Google Analytics 4 (Reporting API)'
          description='Live GA4 property metrics — separate from first-party event mirror below.'
        />
        <p className='text-xs text-amber-950 flex gap-2 items-start'>
          <AlertCircle className='h-4 w-4 shrink-0 mt-0.5' />
          {data.setupHint ??
            "Configure GA4_PROPERTY_ID and service account credentials on the API server."}
        </p>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ?
            <Loader2 className='h-3.5 w-3.5 animate-spin mr-1' />
          : <RefreshCw className='h-3.5 w-3.5 mr-1' />}
          Check again
        </Button>
      </div>
    );
  }

  if (data.lastError) {
    return (
      <div className='rounded-xl border border-red-200 bg-red-50 p-5 space-y-2'>
        <AnalyticsSectionHeader
          title='Google Analytics 4 (Reporting API)'
          description={`Property ${data.propertyId ?? ""} · last ${data.periodDays} days`}
        />
        <p className='text-xs text-red-800'>{data.lastError}</p>
        <p className='text-[10px] text-red-700/80'>{data.setupHint}</p>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => void refresh()}
          disabled={loading}
        >
          Retry
        </Button>
      </div>
    );
  }

  const o = data.overview;
  const ec = data.ecommerce;

  return (
    <div className='space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <AnalyticsSectionHeader
          title='Google Analytics 4 (Reporting API)'
          description={`Official GA4 Data API · property ${data.propertyId} · last ${data.periodDays} days · cached on dashboard refresh.`}
        />
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ?
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          : <RefreshCw className='h-3.5 w-3.5' />}
        </Button>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-5 gap-2'>
        <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
          <p className='text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1'>
            <Users className='h-3 w-3' />
            Active users
          </p>
          <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
            {(o?.activeUsers ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Sessions
          </p>
          <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
            {(o?.sessions ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Engagement rate
          </p>
          <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
            {o?.engagementRate ?? 0}%
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
          <p className='text-[10px] font-bold uppercase text-gray-500'>
            Events
          </p>
          <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
            {(o?.eventCount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-gray-50/80 p-3'>
          <p className='text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1'>
            <IndianRupee className='h-3 w-3' />
            Revenue
          </p>
          <p className='text-xl font-bold tabular-nums text-navy-900 mt-1'>
            {o?.totalRevenue != null && o.totalRevenue > 0 ?
              formatPrice(o.totalRevenue)
            : "—"}
          </p>
        </div>
      </div>

      {ec ?
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]'>
          <div className='rounded-lg border border-violet-100 bg-violet-50/50 p-2.5'>
            <p className='text-gray-500'>Items viewed</p>
            <p className='font-bold tabular-nums'>
              {ec.itemsViewed.toLocaleString()}
            </p>
          </div>
          <div className='rounded-lg border border-violet-100 bg-violet-50/50 p-2.5'>
            <p className='text-gray-500'>Add to carts</p>
            <p className='font-bold tabular-nums'>
              {ec.addToCarts.toLocaleString()}
            </p>
          </div>
          <div className='rounded-lg border border-violet-100 bg-violet-50/50 p-2.5'>
            <p className='text-gray-500'>Purchases</p>
            <p className='font-bold tabular-nums'>
              {ec.purchases.toLocaleString()}
            </p>
          </div>
          <div className='rounded-lg border border-violet-100 bg-violet-50/50 p-2.5'>
            <p className='text-gray-500'>Purchase revenue</p>
            <p className='font-bold tabular-nums'>
              {formatPrice(ec.purchaseRevenue)}
            </p>
          </div>
        </div>
      : null}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
        <div className='rounded-lg border border-gray-100 p-3'>
          <p className='text-xs font-semibold text-gray-800 mb-2'>
            Users & sessions (daily)
          </p>
          {dailyChart.length === 0 ?
            <p className='text-xs text-gray-500 py-8 text-center'>
              No daily rows
            </p>
          : <ResponsiveContainer width='100%' height={220}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type='monotone'
                  dataKey='activeUsers'
                  name='Active users'
                  stroke='#14192f'
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type='monotone'
                  dataKey='sessions'
                  name='Sessions'
                  stroke='#6d28d9'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          }
        </div>

        <div className='rounded-lg border border-gray-100 p-3'>
          <p className='text-xs font-semibold text-gray-800 mb-2'>
            Top events (GA4)
          </p>
          {!data.topEvents?.length ?
            <p className='text-xs text-gray-500 py-8 text-center'>No events</p>
          : <ResponsiveContainer width='100%' height={220}>
              <BarChart data={data.topEvents.slice(0, 10)} layout='vertical'>
                <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                <XAxis type='number' tick={{ fontSize: 9 }} />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={100}
                  tick={{ fontSize: 8 }}
                />
                <Tooltip />
                <Bar dataKey='count' fill='#6d28d9' radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </div>

      {data.topPages && data.topPages.length > 0 ?
        <div className='rounded-lg border border-gray-100 p-3'>
          <p className='text-xs font-semibold text-gray-800 mb-2'>Top pages</p>
          <ul className='space-y-1'>
            {data.topPages.map((p) => (
              <li
                key={p.path}
                className='flex justify-between text-[11px] gap-2 border-b border-gray-50 pb-1'
              >
                <span className='text-gray-700 truncate'>{p.path}</span>
                <span className='font-bold tabular-nums shrink-0'>
                  {p.views.toLocaleString()} views
                </span>
              </li>
            ))}
          </ul>
        </div>
      : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Eye, Megaphone, MapPin, BarChart3, ArrowUpRight } from "lucide-react";
import type { DashboardAnalytics } from "@/types";

export default function AdminTrafficPulseStrip({
  overview,
  marketing,
  commerce,
}: {
  overview: DashboardAnalytics["overview"];
  marketing?: DashboardAnalytics["marketingInsights"];
  commerce?: DashboardAnalytics["commerceInsights"];
}) {
  const visitsToday = overview.siteVisitsToday ?? 0;
  const visitsMtd = overview.siteVisitsMtd ?? 0;
  const adOrders = marketing?.attributedOrders ?? 0;
  const topState = commerce?.ordersByIndiaState?.[0];

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <div className='h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0'>
            <BarChart3 className='h-5 w-5 text-brand-700' />
          </div>
          <div>
            <h3 className='text-sm font-semibold text-navy-900'>
              Traffic snapshot
            </h3>
            <p className='text-xs text-gray-500 mt-0.5'>
              Today&apos;s visits, attributed orders, and top shipping state
            </p>
          </div>
        </div>
        <Link
          href='/admin/analytics?tab=traffic'
          className='inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-800 shrink-0'
        >
          Acquisition analytics
          <ArrowUpRight className='h-3.5 w-3.5' />
        </Link>
      </div>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3'>
        <div className='rounded-xl border border-gray-100 bg-white px-3 py-2.5'>
          <p className='text-[10px] text-gray-500 flex items-center gap-1'>
            <Eye className='h-3 w-3' /> Visits today
          </p>
          <p className='text-xl font-bold tabular-nums text-gray-900'>
            {visitsToday}
          </p>
          <p className='text-[9px] text-gray-400'>{visitsMtd} MTD</p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white px-3 py-2.5'>
          <p className='text-[10px] text-gray-500 flex items-center gap-1'>
            <Megaphone className='h-3 w-3' /> Attributed orders
          </p>
          <p className='text-xl font-bold tabular-nums text-gray-900'>
            {adOrders}
          </p>
          <p className='text-[9px] text-gray-400'>
            {marketing?.utmTaggedVisits ?? 0} tagged sessions
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white px-3 py-2.5'>
          <p className='text-[10px] text-gray-500 flex items-center gap-1'>
            <MapPin className='h-3 w-3' /> Top order state
          </p>
          <p className='text-sm font-bold text-gray-900 truncate'>
            {topState?.state ?? "—"}
          </p>
          <p className='text-[9px] text-gray-400 tabular-nums'>
            {topState ?
              `${topState.orders} orders · 30d`
            : "No paid orders yet"}
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white px-3 py-2.5'>
          <p className='text-[10px] text-gray-500'>Session to paid</p>
          <p className='text-xl font-bold tabular-nums text-emerald-700'>
            {commerce?.trafficFunnel?.sessionToPaidPercent ?? 0}%
          </p>
          <p className='text-[9px] text-gray-400'>Last 30 days</p>
        </div>
      </div>
    </section>
  );
}

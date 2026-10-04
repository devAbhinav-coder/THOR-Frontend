"use client";

import { Megaphone, MousePointerClick, Hash, Eye } from "lucide-react";
import type { DashboardAnalytics } from "@/types";

type MarketingInsights = NonNullable<DashboardAnalytics["marketingInsights"]>;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Megaphone;
}) {
  return (
    <div className='rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5'>
      <p className='text-[10px] font-medium text-gray-500 flex items-center gap-1'>
        <Icon className='h-3 w-3 shrink-0' aria-hidden />
        {label}
      </p>
      <p className='text-2xl font-bold tabular-nums text-navy-900 mt-0.5'>
        {value.toLocaleString()}
      </p>
      <p className='text-[9px] text-gray-400 mt-0.5 leading-snug'>{hint}</p>
    </div>
  );
}

export default function MarketingAdSummaryCards({
  marketingInsights,
  visitCampaigns,
}: {
  marketingInsights?: MarketingInsights;
  visitCampaigns?: { campaign: string; visits: number }[];
}) {
  const adOrders = marketingInsights?.attributedOrders ?? 0;
  const metaClicks = marketingInsights?.fbclidVisits ?? 0;
  const adVisits = marketingInsights?.utmTaggedVisits ?? 0;

  const campaignSet = new Set<string>();
  for (const row of visitCampaigns ?? []) {
    if (row.campaign?.trim()) campaignSet.add(row.campaign.trim());
  }
  for (const row of marketingInsights?.ordersByCampaign ?? []) {
    if (row.campaign?.trim()) campaignSet.add(row.campaign.trim());
  }
  for (const row of marketingInsights?.adAttributionRows ?? []) {
    if (row.campaign?.trim()) campaignSet.add(row.campaign.trim());
  }

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-2'>
      <StatCard
        label='Ad orders'
        value={adOrders}
        hint='Paid · marketing tag saved at checkout · 30d'
        icon={Megaphone}
      />
      <StatCard
        label='Meta clicks'
        value={metaClicks}
        hint='Sessions landed with fbclid · 30d'
        icon={MousePointerClick}
      />
      <StatCard
        label='Campaigns'
        value={campaignSet.size}
        hint='Unique utm_campaign in visits or orders · 30d'
        icon={Hash}
      />
      <StatCard
        label='Ad visits'
        value={adVisits}
        hint='Sessions with UTM or fbclid on landing · 30d'
        icon={Eye}
      />
    </div>
  );
}

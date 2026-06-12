'use client';

import { ArrowRight, Minus, Plus, Equal } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import type { FinancialSnapshot } from '@/lib/revenueMetrics';

type StepTone = 'base' | 'minus' | 'plus' | 'result' | 'highlight';

function FlowStep({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: StepTone;
}) {
  const styles: Record<StepTone, string> = {
    base: 'border-brand-200 bg-brand-50/60',
    minus: 'border-red-200 bg-red-50/50',
    plus: 'border-emerald-200 bg-emerald-50/50',
    result: 'border-navy-300 bg-navy-50/80 ring-1 ring-navy-200/60',
    highlight: 'border-brand-400 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-brand-600',
  };
  const isHighlight = tone === 'highlight';

  return (
    <div className={cn('rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 min-w-[7.5rem] sm:min-w-0 flex-1', styles[tone])}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wide', isHighlight ? 'text-brand-100' : 'text-gray-500')}>
        {label}
      </p>
      <p className={cn('text-base sm:text-lg font-bold font-serif tabular-nums mt-0.5', isHighlight ? 'text-white' : 'text-gray-900')}>
        {value}
      </p>
      {sub && (
        <p className={cn('text-[10px] mt-0.5 leading-tight', isHighlight ? 'text-brand-100/90' : 'text-gray-400')}>
          {sub}
        </p>
      )}
    </div>
  );
}

function FlowArrow({ icon: Icon }: { icon: typeof ArrowRight }) {
  return (
    <div className="flex items-center justify-center shrink-0 text-gray-300 px-0.5 sm:px-1">
      <Icon className="h-4 w-4 hidden sm:block" />
      <span className="sm:hidden text-gray-300 font-bold">→</span>
    </div>
  );
}

export default function FinancialOverviewPanel({ fin }: { fin: FinancialSnapshot }) {
  const metricCards = [
    { label: 'Gross revenue', value: formatPrice(fin.grossRevenue), hint: 'Order checkout totals (paid + refunded)', color: 'text-brand-900' },
    { label: 'Net revenue', value: formatPrice(fin.netRevenue), hint: 'Gross − refunds (cash retained)', color: 'text-navy-900' },
    { label: 'Net product revenue', value: formatPrice(fin.productRevenue), hint: 'Paid line items only', color: 'text-gray-900' },
    { label: 'COGS', value: formatPrice(fin.cogs), hint: 'Cost of goods sold', color: 'text-slate-700' },
    { label: 'Gross profit', value: formatPrice(fin.grossProfit), hint: `${fin.grossMarginPct}% product margin`, color: 'text-emerald-700' },
    { label: 'Net income', value: formatPrice(fin.netIncome), hint: `Profit + fees − coupons · ${fin.netIncomeMarginPct}%`, color: 'text-brand-700' },
    ...(fin.operatingExpenses > 0
      ? [
          { label: 'Operating costs', value: formatPrice(fin.operatingExpenses), hint: 'Logged in Operating costs', color: 'text-red-600' },
          { label: 'Net after costs', value: formatPrice(fin.netAfterOperating), hint: 'Net income − operating', color: 'text-navy-900' },
        ]
      : []),
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Complete financial picture</h2>
        <p className="text-xs text-gray-500 mt-1">
          Gross revenue → net revenue (cash) · product revenue → gross profit → net income (after fees &amp; coupons)
        </p>
      </div>

      {/* Cash flow row */}
      <div className="rounded-[1.5rem] border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cash flow (orders)</p>
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1 sm:overflow-visible sm:flex-wrap">
          <FlowStep label="Gross revenue" value={formatPrice(fin.grossRevenue)} sub="All checkout totals" tone="base" />
          <FlowArrow icon={Minus} />
          <FlowStep label="Refunds" value={formatPrice(fin.refunds)} sub="Cash returned" tone="minus" />
          <FlowArrow icon={Equal} />
          <FlowStep label="Net revenue" value={formatPrice(fin.netRevenue)} sub="Cash you kept" tone="result" />
        </div>
      </div>

      {/* Profit flow row */}
      <div className="rounded-[1.5rem] border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Profit (products sold)</p>
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1 sm:overflow-visible">
          <FlowStep label="Net product revenue" value={formatPrice(fin.productRevenue)} sub="Paid line sales" tone="base" />
          <FlowArrow icon={Minus} />
          <FlowStep label="COGS" value={formatPrice(fin.cogs)} sub="Unit costs" tone="minus" />
          <FlowArrow icon={Equal} />
          <FlowStep label="Gross profit" value={formatPrice(fin.grossProfit)} sub={`${fin.grossMarginPct}% margin`} tone="result" />
          <FlowArrow icon={Plus} />
          <FlowStep label="Fees +" value={formatPrice(fin.shippingFees + fin.codFees + fin.feesRetained)} sub="Ship · COD · kept" tone="plus" />
          <FlowArrow icon={Minus} />
          <FlowStep label="Coupons −" value={formatPrice(fin.couponDiscounts)} tone="minus" />
          <FlowArrow icon={Equal} />
          <FlowStep
            label="Net income"
            value={formatPrice(fin.netIncome)}
            sub={fin.operatingExpenses > 0 ? 'Before shop costs' : 'After fees − coupons'}
            tone={fin.operatingExpenses > 0 ? 'result' : 'highlight'}
          />
          {fin.operatingExpenses > 0 && (
            <>
              <FlowArrow icon={Minus} />
              <FlowStep
                label="Operating costs"
                value={formatPrice(fin.operatingExpenses)}
                sub="Ship · pack · ads · misc"
                tone="minus"
              />
              <FlowArrow icon={Equal} />
              <FlowStep
                label="Net after costs"
                value={formatPrice(fin.netAfterOperating)}
                sub="True bottom line (est.)"
                tone="highlight"
              />
            </>
          )}
        </div>
      </div>

      {/* All metrics grid — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-xl border border-transparent bg-white shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className={cn('text-lg font-bold tabular-nums mt-1', m.color)}>{m.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { formatPrice, cn } from '@/lib/utils';

type Props = {
  gross: number;
  refunded: number;
  netLike: number;
  className?: string;
  size?: 'md' | 'lg';
};

/**
 * Donut showing how lifetime gross splits into retained (after recorded refunds) vs refund outflow.
 * Uses conic-gradient — no chart library.
 */
export default function RevenueCompositionDonut({ gross, refunded, netLike, className, size = 'lg' }: Props) {
  const g = Math.max(0, gross);
  const r = Math.max(0, refunded);
  const net = Math.max(0, netLike);
  const dim = size === 'lg' ? 'h-[min(280px,72vw)] w-[min(280px,72vw)]' : 'h-48 w-48';
  const innerPct = size === 'lg' ? '22%' : '24%';

  if (g <= 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center', dim, className)}>
        <div
          className={cn(
            'relative rounded-full bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/80 shadow-inner',
            dim,
          )}
        >
          <div
            className="absolute bg-white rounded-full shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center px-4"
            style={{ inset: innerPct }}
          >
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">No paid revenue yet</p>
            <p className="text-sm text-gray-500 mt-1">When orders pay, this ring fills in.</p>
          </div>
        </div>
      </div>
    );
  }

  const retainRatio = Math.min(1, net / g);
  const refundRatio = Math.min(1 - retainRatio, r / g);
  const t1 = retainRatio;
  const t2 = Math.min(1, t1 + refundRatio);

  const gradient = `conic-gradient(from -90deg, 
    rgb(5 150 105) 0turn ${t1}turn, 
    rgb(245 158 11) ${t1}turn ${t2}turn, 
    rgb(226 232 240) ${t2}turn 1turn)`;

  const refundPct = Math.round((r / g) * 1000) / 10;
  const retainPct = Math.round((net / g) * 1000) / 10;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative mx-auto', dim)}>
        <div className="h-full w-full rounded-full shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)]" style={{ background: gradient }} />
        <div
          className="absolute bg-white rounded-full flex flex-col items-center justify-center text-center px-3 sm:px-5 shadow-sm border border-gray-100/90"
          style={{ inset: innerPct }}
        >
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Retained</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums tracking-tight mt-0.5">{formatPrice(net)}</p>
          <p className="text-[10px] text-gray-500 mt-1 max-w-[9rem] leading-snug">
            {retainPct}% of lifetime gross
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-sm" aria-hidden />
          <span className="text-gray-600">
            Retained <span className="font-semibold text-gray-900 tabular-nums">{retainPct}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" aria-hidden />
          <span className="text-gray-600">
            Refunded <span className="font-semibold text-gray-900 tabular-nums">{refundPct}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
          <span className="text-gray-500 text-xs">Ring = 100% of gross ({formatPrice(g)})</span>
        </div>
      </div>
    </div>
  );
}

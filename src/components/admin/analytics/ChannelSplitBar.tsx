'use client';

import { formatPrice } from '@/lib/utils';

type Props = {
  onlineRevenue: number;
  offlineRevenue: number;
  onlineCount: number;
  offlineCount: number;
};

export default function ChannelSplitBar({
  onlineRevenue,
  offlineRevenue,
  onlineCount,
  offlineCount,
}: Props) {
  const total = onlineRevenue + offlineRevenue;
  const totalOrders = onlineCount + offlineCount;

  if (total === 0 && totalOrders === 0) {
    return (
      <p className="text-xs text-gray-500 py-3 text-center">No paid orders yet — split appears when sales come in.</p>
    );
  }

  const onlinePct = total > 0 ? (onlineRevenue / total) * 100 : (onlineCount / Math.max(totalOrders, 1)) * 100;
  const offlinePct = 100 - onlinePct;

  return (
    <div className="space-y-3">
      <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-100 ring-1 ring-black/5">
        <div
          className="h-full bg-gradient-to-r from-navy-900 to-navy-700 transition-all duration-500"
          style={{ width: `${onlinePct}%` }}
          title={`Online ${onlinePct.toFixed(1)}%`}
        />
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
          style={{ width: `${offlinePct}%` }}
          title={`Offline ${offlinePct.toFixed(1)}%`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-navy-50/80 border border-navy-100 p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-navy-800/80">Online</p>
          <p className="text-base font-bold text-navy-950 tabular-nums">{formatPrice(onlineRevenue)}</p>
          <p className="text-[9px] text-navy-700/90 tabular-nums">
            {onlineCount} orders · {onlinePct.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg bg-brand-50/80 border border-brand-100 p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-brand-900/80">Offline</p>
          <p className="text-base font-bold text-brand-950 tabular-nums">{formatPrice(offlineRevenue)}</p>
          <p className="text-[9px] text-brand-800/90 tabular-nums">
            {offlineCount} orders · {offlinePct.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}

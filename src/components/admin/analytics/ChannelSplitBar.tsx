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
  const onlinePct = total > 0 ? (onlineRevenue / total) * 100 : 50;
  const offlinePct = 100 - onlinePct;

  return (
    <div className="space-y-4">
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
          style={{ width: `${onlinePct}%` }}
          title={`Online ${onlinePct.toFixed(1)}%`}
        />
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
          style={{ width: `${offlinePct}%` }}
          title={`Offline ${offlinePct.toFixed(1)}%`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-800/80">Online store</p>
          <p className="text-lg font-bold text-blue-950 tabular-nums mt-1">{formatPrice(onlineRevenue)}</p>
          <p className="text-[10px] text-blue-700/90 mt-0.5 tabular-nums">
            {onlineCount} orders · {onlinePct.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/80">Offline / stall</p>
          <p className="text-lg font-bold text-amber-950 tabular-nums mt-1">{formatPrice(offlineRevenue)}</p>
          <p className="text-[10px] text-amber-800/90 mt-0.5 tabular-nums">
            {offlineCount} orders · {offlinePct.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}

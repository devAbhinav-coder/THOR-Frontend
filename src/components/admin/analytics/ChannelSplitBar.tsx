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
      <div className="group h-3 w-full rounded-full overflow-hidden flex bg-gray-100 ring-1 ring-black/5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-navy-900 to-navy-700 transition-all duration-700 ease-out hover:brightness-125 cursor-pointer relative after:absolute after:inset-0 after:bg-white/0 hover:after:bg-white/10"
          style={{ width: `${onlinePct}%` }}
          title={`Online ${onlinePct.toFixed(1)}%`}
        />
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700 ease-out hover:brightness-110 cursor-pointer relative after:absolute after:inset-0 after:bg-white/0 hover:after:bg-white/10"
          style={{ width: `${offlinePct}%` }}
          title={`Offline ${offlinePct.toFixed(1)}%`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-navy-50/80 border border-navy-100 p-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:bg-navy-50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-navy-800/80">Online store</p>
          <p className="text-lg font-bold text-navy-950 tabular-nums mt-1">{formatPrice(onlineRevenue)}</p>
          <p className="text-[10px] text-navy-700/90 mt-0.5 tabular-nums">
            {onlineCount} orders · {onlinePct.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl bg-brand-50/80 border border-brand-100 p-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:bg-brand-50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-900/80">Offline / stall</p>
          <p className="text-lg font-bold text-brand-950 tabular-nums mt-1">{formatPrice(offlineRevenue)}</p>
          <p className="text-[10px] text-brand-800/90 mt-0.5 tabular-nums">
            {offlineCount} orders · {offlinePct.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}

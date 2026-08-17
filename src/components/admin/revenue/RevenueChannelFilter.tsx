'use client';

import { Globe, Store, Building2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderChannelFilter } from '@/lib/orderChannel';

const CHANNELS: {
  id: OrderChannelFilter;
  label: string;
  hint: string;
  icon: typeof Globe;
  activeClass: string;
}[] = [
  {
    id: 'all',
    label: 'All channels',
    hint: 'Website + offline POS + B2B',
    icon: LayoutGrid,
    activeClass: 'bg-gray-900 text-white border-gray-900',
  },
  {
    id: 'online',
    label: 'Online',
    hint: 'Website checkout',
    icon: Globe,
    activeClass: 'bg-navy-900 text-white border-navy-900',
  },
  {
    id: 'offline',
    label: 'Offline',
    hint: 'Stall & personal sales',
    icon: Store,
    activeClass: 'bg-brand-600 text-white border-brand-600',
  },
  {
    id: 'b2b',
    label: 'B2B',
    hint: 'Wholesale orders',
    icon: Building2,
    activeClass: 'bg-violet-700 text-white border-violet-700',
  },
];

export default function RevenueChannelFilter({
  channel,
  onChange,
  disabled,
}: {
  channel: OrderChannelFilter;
  onChange: (channel: OrderChannelFilter) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
        Sales channel
      </p>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((item) => {
          const Icon = item.icon;
          const isActive = channel === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              title={item.hint}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all',
                isActive ?
                  cn(item.activeClass, 'shadow-sm')
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

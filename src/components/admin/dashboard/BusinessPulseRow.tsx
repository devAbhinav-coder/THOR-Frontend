'use client';

import { Users, Tag, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

export default function BusinessPulseRow({ overview }: { overview: DashboardAnalytics['overview'] }) {
  const items = [
    {
      label: 'Repeat customers',
      value: `${overview.repeatRate || 0}%`,
      sub: `${overview.repeatCustomers || 0} buyers returned`,
      icon: Users,
      border: 'border-blue-100',
      bg: 'bg-blue-50/40',
      iconBg: 'bg-blue-100 text-blue-600',
      labelColor: 'text-blue-500',
      valueColor: 'text-blue-900',
      subColor: 'text-blue-600/80',
    },
    {
      label: 'Coupon impact',
      value: formatPrice(overview.couponDiscountTotal || 0),
      sub: `${overview.couponOrdersTotal || 0} orders used codes`,
      icon: Tag,
      border: 'border-purple-100',
      bg: 'bg-purple-50/40',
      iconBg: 'bg-purple-100 text-purple-600',
      labelColor: 'text-purple-500',
      valueColor: 'text-purple-900',
      subColor: 'text-purple-600/80',
    },
    {
      label: 'Order friction',
      value: `${overview.cancellationRate || 0}%`,
      sub: `${overview.cancellationCount || 0} cancellations`,
      icon: AlertCircle,
      border: 'border-red-100',
      bg: 'bg-red-50/40',
      iconBg: 'bg-red-100 text-red-600',
      labelColor: 'text-red-500',
      valueColor: 'text-red-900',
      subColor: 'text-red-600/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border ${item.border} ${item.bg} p-4 sm:p-5 flex items-center gap-4`}
        >
          <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
            <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${item.labelColor}`}>{item.label}</p>
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${item.valueColor}`}>{item.value}</p>
            <p className={`text-[11px] font-medium ${item.subColor}`}>{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

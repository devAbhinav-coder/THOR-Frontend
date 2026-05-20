'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminMetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  growth?: number;
  variant?: 'default' | 'navy' | 'danger' | 'success';
  className?: string;
};

const variantStyles = {
  default: {
    card: 'from-white to-gray-50/50 border-gray-100/90',
    icon: 'bg-brand-50 text-brand-600',
  },
  navy: {
    card: 'from-navy-900 via-navy-950 to-navy-900 border-navy-800 text-white',
    icon: 'bg-white/10 text-gold-300 border border-white/10',
  },
  danger: {
    card: 'from-red-50/40 to-white border-red-100',
    icon: 'bg-red-100 text-red-600',
  },
  success: {
    card: 'from-emerald-50/40 to-white border-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
  },
};

export default function AdminMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  growth,
  variant = 'default',
  className,
}: AdminMetricCardProps) {
  const v = variantStyles[variant];
  const isNavy = variant === 'navy';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md bg-gradient-to-br',
        v.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', v.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        {growth !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full',
              growth >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50',
            )}
          >
            {growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p
        className={cn(
          'text-xl sm:text-2xl font-bold font-serif tracking-tight tabular-nums',
          isNavy ? 'text-white' : 'text-gray-900',
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn('text-[11px] mt-1 leading-snug', isNavy ? 'text-white/50' : 'text-gray-500')}>
          {sub}
        </p>
      )}
      <p className={cn('text-xs sm:text-sm font-semibold mt-2', isNavy ? 'text-white/85' : 'text-gray-700')}>
        {label}
      </p>
    </div>
  );
}

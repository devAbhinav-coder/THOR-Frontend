import { cn } from '@/lib/utils';

interface MiniStatProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'navy' | 'emerald' | 'amber' | 'default';
}

export function MiniStat({ label, value, sub, accent = 'default' }: MiniStatProps) {
  const accentClasses = {
    default: 'text-gray-900',
    navy: 'text-navy-900',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
  };

  const labelClasses = {
    default: 'text-gray-500',
    navy: 'text-navy-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };

  const subClasses = {
    default: 'text-gray-400',
    navy: 'text-navy-400',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500/80',
  };

  const bgClasses = {
    default: 'bg-gray-50/50',
    navy: 'bg-navy-50/50',
    emerald: 'bg-emerald-50/50',
    amber: 'bg-amber-50/50',
  };

  return (
    <div className={cn("rounded-xl border border-gray-100 p-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer", bgClasses[accent])}>
      <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors", labelClasses[accent], accent === 'default' && 'group-hover:text-brand-500')}>
        {label}
      </p>
      <p className={cn("text-lg font-bold tabular-nums", accentClasses[accent])}>
        {value}
      </p>
      {sub && <p className={cn("text-[10px] mt-0.5", subClasses[accent])}>{sub}</p>}
    </div>
  );
}

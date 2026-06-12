import { cn } from '@/lib/utils';

interface LeakCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'red' | 'emerald' | 'default';
  className?: string;
}

export function LeakCard({ label, value, sub, tone = 'default', className }: LeakCardProps) {
  const toneClasses = {
    default: 'text-gray-900 border-gray-100 bg-gray-50/50',
    red: 'text-red-600 border-red-100 bg-red-50/50',
    emerald: 'text-emerald-700 border-emerald-100 bg-emerald-50/50',
  };

  const labelClasses = {
    default: 'text-gray-500',
    red: 'text-red-500',
    emerald: 'text-emerald-600',
  };

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer", toneClasses[tone], className)}>
      <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1.5 transition-colors", labelClasses[tone], tone === 'default' && 'group-hover:text-brand-500')}>
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums">
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

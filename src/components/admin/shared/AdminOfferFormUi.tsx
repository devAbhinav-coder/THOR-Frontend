'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

const selectCls =
  'w-full h-10 px-3.5 rounded-xl text-sm bg-gray-50/80 border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400/50 focus:bg-white transition-all';

const inputCls =
  'w-full h-10 px-3.5 rounded-xl text-sm bg-gray-50/80 border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400/50 focus:bg-white transition-all';

const textareaCls =
  'w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50/80 border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400/50 focus:bg-white transition-all resize-y min-h-[88px]';

type Accent = 'coupon' | 'sale' | 'promotion' | 'product';

/** Scroll works; scrollbar hidden (modal + inner lists). */
export const hideScrollbarCls =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const accentHeader: Record<Accent, string> = {
  coupon: 'from-emerald-800 via-navy-900 to-brand-700',
  sale: 'from-navy-900 via-navy-800 to-brand-700',
  promotion: 'from-violet-900 via-navy-900 to-brand-700',
  product: 'from-amber-900 via-navy-900 to-brand-700',
};

interface AdminOfferModalProps {
  accent?: Accent;
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: 'xl' | '2xl' | '3xl' | '4xl';
  footerClassName?: string;
}

export function AdminOfferModal({
  accent = 'sale',
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = '2xl',
  footerClassName,
}: AdminOfferModalProps) {
  const maxWidthCls =
    maxWidth === 'xl' ? 'sm:max-w-xl'
    : maxWidth === '3xl' ? 'sm:max-w-3xl'
    : maxWidth === '4xl' ? 'sm:max-w-4xl'
    : 'sm:max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-sm p-0 sm:p-4">
      <div
        className={cn(
          'w-full max-h-[94vh] overflow-hidden flex flex-col',
          'rounded-t-3xl sm:rounded-3xl',
          'bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-navy-900/15',
          maxWidthCls,
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-3 px-5 py-4 shrink-0',
            'bg-gradient-to-r text-white border-b border-white/10',
            accentHeader[accent],
          )}
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/65 font-semibold">
              {eyebrow}
            </p>
            <h2 className="text-lg sm:text-xl font-serif font-bold mt-0.5 truncate">{title}</h2>
            {subtitle ? (
              <p className="text-xs text-white/75 mt-1 leading-relaxed max-w-md">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            'overflow-y-auto flex-1 px-4 sm:px-5 py-4 sm:py-5 space-y-4 min-h-0',
            hideScrollbarCls,
          )}
        >
          {children}
        </div>

        <div className={cn('flex gap-2.5 p-4 sm:p-5 border-t border-gray-100/80 bg-gray-50/60 shrink-0', footerClassName)}>
          {footer}
        </div>
      </div>
    </div>
  );
}

interface AdminOfferSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'highlight';
}

export function AdminOfferSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  variant = 'default',
}: AdminOfferSectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-4 space-y-3',
        variant === 'default' && 'border-gray-200/80 bg-white/70',
        variant === 'muted' && 'border-gray-100 bg-gray-50/60',
        variant === 'highlight' && 'border-brand-200/60 bg-brand-50/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {Icon ? (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-gray-200/80 text-brand-700 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {description ? (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface AdminOfferFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminOfferField({ label, required, hint, children, className }: AdminOfferFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
        {required ? <span className="text-brand-600 ml-0.5">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-gray-500 leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function AdminOfferSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select value={value} onChange={onChange} className={cn(selectCls, className)}>
      {children}
    </select>
  );
}

export function AdminOfferDateTime({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={onChange}
      required={required}
      className={inputCls}
    />
  );
}

export function AdminOfferTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className={textareaCls}
    />
  );
}

interface ToggleCardOption {
  value: string | boolean;
  title: string;
  description: string;
}

export function AdminOfferToggleCards<T extends string | boolean>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ToggleCardOption[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value as T)}
            className={cn(
              'text-left rounded-xl border px-3.5 py-3 transition-all',
              selected
                ? 'border-brand-600/40 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                : 'border-gray-200/80 bg-white/60 hover:border-gray-300 hover:bg-white',
            )}
          >
            <p className="text-sm font-semibold text-gray-900">{opt.title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function AdminOfferSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="block h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-brand-600 transition-colors" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="min-w-0">
        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</span>
        {description ? (
          <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function AdminOfferPresetPills({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ key: string; label: string }>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
            selected === opt.key
              ? 'border-brand-700 bg-brand-700 text-white shadow-sm'
              : 'border-gray-200 bg-white/70 text-gray-700 hover:border-brand-300 hover:text-brand-800',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AdminOfferInfoBox({
  children,
  tone = 'amber',
}: {
  children: React.ReactNode;
  tone?: 'amber' | 'blue' | 'emerald';
}) {
  const tones = {
    amber: 'border-amber-200/80 bg-amber-50/80 text-amber-950',
    blue: 'border-blue-200/80 bg-blue-50/80 text-blue-950',
    emerald: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-950',
  };
  return (
    <div className={cn('rounded-xl border px-3.5 py-3 text-xs leading-relaxed', tones[tone])}>
      {children}
    </div>
  );
}

export const adminOfferInputCls = inputCls;
export const adminOfferTextareaCls = textareaCls;
export const adminOfferSelectCls = selectCls;

'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricTooltipLine {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface MetricTooltipProps {
  title: string;
  lines: MetricTooltipLine[];
  note?: string;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  /** top = opens above trigger (default, avoids clipping next row) */
  placement?: 'top' | 'bottom';
}

export default function MetricTooltip({
  title,
  lines,
  note,
  children,
  className,
  align = 'left',
  placement = 'top',
}: MetricTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipW = Math.min(288, window.innerWidth - 16);
    const gap = 8;

    let left = rect.left;
    if (align === 'center') {
      left = rect.left + rect.width / 2 - tooltipW / 2;
    } else if (align === 'right') {
      left = rect.right - tooltipW;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));

    const top =
      placement === 'bottom' ?
        rect.bottom + gap
      : rect.top - gap;

    setCoords({ top, left });
  }, [align, placement]);

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  const hide = () => setOpen(false);

  const tooltipEl = open && typeof document !== 'undefined' ? (
    createPortal(
      <div
        role="tooltip"
        className={cn(
          'fixed z-[9999] w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-gray-200 bg-white shadow-2xl p-3 pointer-events-auto',
        )}
        style={{
          top: placement === 'bottom' ? coords.top : undefined,
          bottom: placement === 'top' ? window.innerHeight - coords.top : undefined,
          left: coords.left,
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide flex items-center gap-1">
          <Info className="h-3 w-3 shrink-0" />
          {title}
        </p>
        <dl className="mt-2 space-y-1.5">
          {lines.map((line) => (
            <div key={line.label} className="flex items-start justify-between gap-3 text-[11px]">
              <dt className="text-gray-500 shrink-0">{line.label}</dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums text-right',
                  line.highlight ? 'text-emerald-700' : 'text-gray-900',
                )}
              >
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
        {note && (
          <p className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 leading-snug">
            {note}
          </p>
        )}
      </div>,
      document.body,
    )
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('relative inline-flex cursor-help', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {tooltipEl}
    </>
  );
}

export function MetricLabelWithHint({
  label,
  hint,
  tooltip,
}: {
  label: string;
  hint?: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-1">
        {label}
        {tooltip}
      </span>
      {hint && <span className="text-[9px] text-gray-400 font-normal mt-0.5">{hint}</span>}
    </span>
  );
}

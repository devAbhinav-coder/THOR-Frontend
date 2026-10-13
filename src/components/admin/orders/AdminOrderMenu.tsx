"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminOrderMenuItem =
  | {
      type?: "item";
      key: string;
      label: ReactNode;
      hint?: ReactNode;
      icon?: LucideIcon;
      onSelect?: () => void;
      href?: string;
      external?: boolean;
      disabled?: boolean;
      danger?: boolean;
      /** Visual "current" marker */
      active?: boolean;
    }
  | { type: "separator"; key: string }
  | { type: "heading"; key: string; label: ReactNode };

type Props = {
  trigger: ReactNode;
  items: AdminOrderMenuItem[];
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  /** Show chevron on trigger */
  chevron?: boolean;
  disabled?: boolean;
  width?: string;
};

/**
 * Lightweight dropdown menu (no portal) - click-outside + Escape close.
 * Used for "Change status" and "More actions" in the order command bar.
 */
export default function AdminOrderMenu({
  trigger,
  items,
  align = "right",
  className,
  triggerClassName,
  chevron = true,
  disabled,
  width = "w-60",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type='button'
        disabled={disabled}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName,
        )}
      >
        {trigger}
        {chevron ?
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        : null}
      </button>

      {open ?
        <div
          id={menuId}
          role='menu'
          className={cn(
            "absolute z-40 mt-1.5 rounded-xl border border-gray-200 bg-white shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)] p-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[70vh] overflow-y-auto",
            width,
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((it) => {
            if (it.type === "separator") {
              return (
                <div
                  key={it.key}
                  role='separator'
                  className='my-1 h-px bg-gray-100'
                />
              );
            }
            if (it.type === "heading") {
              return (
                <p
                  key={it.key}
                  className='px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400'
                >
                  {it.label}
                </p>
              );
            }
            const Icon = it.icon;
            const cls = cn(
              "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              it.disabled ?
                "text-gray-400 cursor-not-allowed"
              : it.danger ?
                "text-red-700 hover:bg-red-50"
              : "text-gray-800 hover:bg-gray-50",
              it.active && "bg-gray-50 font-semibold",
            );
            const inner = (
              <>
                {Icon ?
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      it.danger ? "text-red-500" : "text-gray-500",
                    )}
                    aria-hidden
                  />
                : null}
                <span className='min-w-0 flex-1'>
                  <span className='block truncate'>{it.label}</span>
                  {it.hint ?
                    <span className='block text-[11px] text-gray-500 font-normal leading-snug'>
                      {it.hint}
                    </span>
                  : null}
                </span>
                {it.active ?
                  <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                    Current
                  </span>
                : null}
              </>
            );
            if (it.href && !it.disabled) {
              return (
                <Link
                  key={it.key}
                  role='menuitem'
                  href={it.href}
                  target={it.external ? "_blank" : undefined}
                  rel={it.external ? "noreferrer" : undefined}
                  className={cls}
                  onClick={() => setOpen(false)}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <button
                key={it.key}
                type='button'
                role='menuitem'
                disabled={it.disabled}
                className={cls}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      : null}
    </div>
  );
}

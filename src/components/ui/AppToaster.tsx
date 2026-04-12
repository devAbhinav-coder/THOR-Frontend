"use client";

import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import toast, { Toaster, resolveValue } from "react-hot-toast";
import type { Toast } from "react-hot-toast";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fully opaque panel colors (reference: solid mint / solid pink — no transparency). */
const TOAST_BG = {
  success: "#d1fae5",
  error: "#ffe4e6",
  loading: "#fff1f2",
  default: "#fafaf9",
} as const;

function splitToastContent(
  resolved: ReactNode,
): { title: ReactNode; description: ReactNode | null } {
  if (typeof resolved === "string") {
    const parts = resolved
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return { title: "", description: null };
    if (parts.length === 1) return { title: parts[0], description: null };
    return {
      title: parts[0],
      description: parts.slice(1).join("\n"),
    };
  }
  return { title: resolved, description: null };
}

function SuccessGlyph() {
  return (
    <Check
      className='h-4 w-4 text-emerald-600'
      strokeWidth={2.35}
      aria-hidden
    />
  );
}

function ErrorGlyph() {
  return (
    <span
      className='select-none font-black leading-none text-[#c81e1e]'
      style={{ fontSize: "1.05rem" }}
      aria-hidden
    >
      !
    </span>
  );
}

function ToastIconBlock({ t }: { t: Toast }) {
  if (t.icon !== undefined) {
    return (
      <div className='relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center'>
        {typeof t.icon === "string" ?
          <span className='text-base'>{t.icon}</span>
        : t.icon}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white",
        "shadow-sm ring-1 ring-black/[0.06]",
      )}
    >
      {t.type === "success" && <SuccessGlyph />}
      {t.type === "error" && <ErrorGlyph />}
      {t.type === "loading" && (
        <Loader2
          className='h-4 w-4 animate-spin text-[#c41230]'
          strokeWidth={2}
          aria-hidden
        />
      )}
      {t.type === "blank" && (
        <span className='text-sm font-bold text-navy-700'>!</span>
      )}
    </div>
  );
}

function toastShellClass(type: Toast["type"]): string {
  switch (type) {
    case "success":
      return cn(
        "border border-emerald-200",
        "shadow-[0_4px_20px_rgba(5,95,69,0.12)]",
      );
    case "error":
      return cn(
        "border border-rose-200",
        "shadow-[0_4px_20px_rgba(190,18,60,0.12)]",
      );
    case "loading":
      return cn(
        "border border-rose-100",
        "shadow-[0_4px_18px_rgba(196,18,48,0.1)]",
      );
    default:
      return cn("border border-gray-200", "shadow-[0_4px_18px_rgba(20,25,47,0.08)]");
  }
}

function solidBackgroundFor(type: Toast["type"]): string {
  switch (type) {
    case "success":
      return TOAST_BG.success;
    case "error":
      return TOAST_BG.error;
    case "loading":
      return TOAST_BG.loading;
    default:
      return TOAST_BG.default;
  }
}

function ToastCard({ toast: t }: { toast: Toast }) {
  const resolved = resolveValue(t.message, t);
  const { title, description } = splitToastContent(resolved);
  const solidBg = solidBackgroundFor(t.type);

  const titleClass =
    t.type === "success" ?
      "text-emerald-950"
    : t.type === "error" ?
      "text-[#7f1d1d]"
    : "text-navy-900";

  const descClass =
    t.type === "success" ?
      "text-emerald-900/85"
    : t.type === "error" ?
      "text-red-900/80"
    : "text-gray-600";

  // react-hot-toast merges toastOptions.style (often background: transparent) — override with opaque fill.
  const mergedStyle: CSSProperties = {
    ...(t.style as CSSProperties),
    backgroundColor: solidBg,
    backgroundImage: "none",
    boxShadow: undefined,
  };

  return (
    <div
      className={cn(
        "hor-toast-enter pointer-events-auto relative flex w-full max-w-[22.5rem] items-center gap-3.5 overflow-hidden rounded-[1.35rem] px-4 py-4 pr-11 transition-[opacity,transform] duration-300 ease-out sm:max-w-[24rem] sm:gap-4 sm:px-5 sm:py-[1.05rem] sm:pr-12",
        toastShellClass(t.type),
        t.visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={mergedStyle}
    >
      <ToastIconBlock t={t} />

      <div
        {...t.ariaProps}
        className='relative z-[1] min-w-0 flex-1 py-0.5 text-left'
      >
        <p
          className={cn(
            "font-sans text-[15px] font-bold leading-tight tracking-tight",
            titleClass,
          )}
        >
          {title}
        </p>
        {description != null &&
          (typeof description === "string" ?
            description.trim().length > 0
          : true) && (
          <p
            className={cn(
              "mt-1 font-sans text-[13px] font-normal leading-relaxed whitespace-pre-line",
              descClass,
            )}
          >
            {description}
          </p>
        )}
      </div>

      <button
        type='button'
        onClick={() => toast.dismiss(t.id)}
        className='absolute right-3 top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/10 hover:text-gray-800'
        aria-label='Dismiss notification'
      >
        <X className='h-[15px] w-[15px]' strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function AppToaster() {
  return (
    <Toaster
      position='top-center'
      reverseOrder={false}
      gutter={10}
      containerClassName='hor-toast-container !z-[10050]'
      containerStyle={{
        /* Below sticky navbar (~h-16) + small gap; add safe-area for notched devices */
        top: "calc(env(safe-area-inset-top, 0px) + 5.25rem)",
      }}
      toastOptions={{
        duration: 4200,
        className: "!bg-transparent !p-0 !shadow-none !border-0",
        style: { background: "transparent", boxShadow: "none", padding: 0 },
        success: {
          duration: 3800,
          iconTheme: { primary: "#059669", secondary: "#ffffff" },
        },
        error: {
          duration: 4800,
          iconTheme: { primary: "#c41230", secondary: "#ffffff" },
        },
        loading: {
          iconTheme: { primary: "#c41230", secondary: "#ffffff" },
        },
      }}
    >
      {(t) => <ToastCard toast={t} />}
    </Toaster>
  );
}

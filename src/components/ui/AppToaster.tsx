"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import toast, { Toaster, resolveValue } from "react-hot-toast";
import type { Toast } from "react-hot-toast";
import { useToasterStore } from "react-hot-toast";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Soft premium gradients by toast intent. */
const TOAST_BG = {
  success: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
  error: "linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)",
  loading: "linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)",
  default: "linear-gradient(135deg, #fafaf9 0%, #ffffff 100%)",
} as const;

const TOAST_SOUND_GAP_MS = 180;

type FeedbackTone = "success" | "error" | "loading" | "default";

function canUseMotionFeedback(): boolean {
  return (
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function triggerToastHaptic(tone: FeedbackTone): void {
  if (!canUseMotionFeedback() || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (tone === "error") {
    navigator.vibrate([10, 24, 12]);
    return;
  }
  if (tone === "loading") {
    navigator.vibrate([8]);
    return;
  }
  navigator.vibrate([10, 16, 8]);
}

function toneFor(type: Toast["type"]): FeedbackTone {
  if (type === "success" || type === "error" || type === "loading") return type;
  return "default";
}

function triggerToastSound(tone: FeedbackTone): void {
  if (typeof window === "undefined") return;
  const AudioContextCtor =
    window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const frequency =
      tone === "success" ? 960
      : tone === "error" ? 260
      : tone === "loading" ? 540
      : 700;

    oscillator.type = tone === "error" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
    oscillator.onended = () => {
      void ctx.close();
    };
  } catch {
    // Browser blocked audio or context failed; no-op for silent fallback.
  }
}

function splitToastContent(resolved: ReactNode): {
  title: ReactNode;
  description: ReactNode | null;
} {
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
      <div className='relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center'>
        {typeof t.icon === "string" ?
          <span className='text-base'>{t.icon}</span>
        : t.icon}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-inner ring-1",
        t.type === "success" &&
          "bg-emerald-100 ring-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
        t.type === "error" &&
          "bg-rose-100 ring-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.32)]",
        t.type === "loading" &&
          "bg-amber-100 ring-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.28)]",
        t.type === "blank" && "bg-slate-100 ring-slate-200 shadow-[0_0_10px_rgba(51,65,85,0.2)]",
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
      return cn(
        "border border-gray-200",
        "shadow-[0_4px_18px_rgba(20,25,47,0.08)]",
      );
  }
}

function backgroundFor(type: Toast["type"]): string {
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

function ToastCard({ toast: t, stackIndex }: { toast: Toast; stackIndex: number }) {
  const resolved = resolveValue(t.message, t);
  const { title, description } = splitToastContent(resolved);
  const bg = backgroundFor(t.type);
  const clampedStackIndex = Math.max(0, Math.min(stackIndex, 3));
  const stackScale = 1 - clampedStackIndex * 0.02;
  const stackOpacity = 1 - clampedStackIndex * 0.06;
  const stackShadow =
    clampedStackIndex === 0
      ? "0 16px 38px rgba(0,0,0,0.14)"
      : clampedStackIndex === 1
        ? "0 11px 26px rgba(0,0,0,0.1)"
        : "0 8px 18px rgba(0,0,0,0.08)";

  const titleClass =
    t.type === "success" ? "text-emerald-950"
    : t.type === "error" ? "text-[#7f1d1d]"
    : "text-navy-900";

  const descClass =
    t.type === "success" ? "text-emerald-900/85"
    : t.type === "error" ? "text-red-900/80"
    : "text-gray-600";
  const hasDescription =
    description != null &&
    (typeof description === "string" ? description.trim().length > 0 : true);

  // react-hot-toast merges toastOptions.style — enforce premium panel treatment.
  const mergedStyle: CSSProperties = {
    ...(t.style as CSSProperties),
    background: bg,
    boxShadow: undefined,
    ["--toast-stack-scale" as string]: String(stackScale),
    ["--toast-stack-shadow" as string]: stackShadow,
    ...(t.visible ? { opacity: stackOpacity } : {}),
  };

  return (
    <div
      className={cn(
        "hor-toast-enter pointer-events-auto relative box-border flex w-full max-w-[17.5rem] shrink-0 gap-3.5 overflow-hidden rounded-2xl border border-white/40 bg-white/70 px-4 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out sm:max-w-[19rem]",
        hasDescription ? "items-start" : "items-center",
        hasDescription ?
          "min-h-[74px] sm:min-h-[78px]"
        : "min-h-[62px] sm:min-h-[66px]",
        toastShellClass(t.type),
        t.visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={mergedStyle}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1.5 rounded-l-2xl",
          t.type === "success" && "bg-emerald-500",
          t.type === "error" && "bg-rose-500",
          t.type === "loading" && "bg-amber-500",
          t.type === "blank" && "bg-slate-500",
        )}
      />
      <ToastIconBlock t={t} />

      <div
        {...t.ariaProps}
        className={cn(
          "relative z-[1] min-w-0 flex-1 text-left",
          hasDescription ? "py-1" : "py-0.5",
        )}
      >
        <p
          className={cn(
            "font-sans text-[15px] font-semibold leading-snug tracking-tight",
            titleClass,
          )}
        >
          {title}
        </p>
        {hasDescription && (
          <p
            className={cn(
              "mt-1 font-sans text-[13.5px] font-normal leading-relaxed whitespace-pre-line",
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
        className='absolute right-2 top-2 z-[2] rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-800'
        aria-label='Dismiss notification'
      >
        <X className='h-[15px] w-[15px]' strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function AppToaster() {
  const { toasts } = useToasterStore();
  const stackedToasts = toasts.filter((item) => item.visible || typeof item.height === "number");
  const handledToastIdsRef = useRef<Set<string>>(new Set());
  const lastSoundAtRef = useRef<number>(0);

  useEffect(() => {
    const liveToastIds = new Set(stackedToasts.map((item) => item.id));

    stackedToasts.forEach((item) => {
      if (!item.visible) return;
      if (handledToastIdsRef.current.has(item.id)) return;
      handledToastIdsRef.current.add(item.id);
      const tone = toneFor(item.type);
      triggerToastHaptic(tone);

      const now = Date.now();
      if (now - lastSoundAtRef.current > TOAST_SOUND_GAP_MS) {
        lastSoundAtRef.current = now;
        triggerToastSound(tone);
      }
    });

    handledToastIdsRef.current.forEach((id) => {
      if (!liveToastIds.has(id)) handledToastIdsRef.current.delete(id);
    });
  }, [stackedToasts]);

  return (
    <Toaster
      position='top-right'
      reverseOrder={false}
      gutter={12}
      containerClassName='hor-toast-container !z-[10050]'
      containerStyle={{
        /* Below sticky navbar (~h-16) + small gap; add safe-area for notched devices */
        top: "calc(env(safe-area-inset-top, 0px) + 5.25rem)",
        right: "max(env(safe-area-inset-right, 0px), 14px)",
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
      {(t) => {
        const stackIndex = Math.max(0, stackedToasts.findIndex((item) => item.id === t.id));
        return <ToastCard toast={t} stackIndex={stackIndex} />;
      }}
    </Toaster>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import toast, { Toaster, resolveValue } from "react-hot-toast";
import type { Toast } from "react-hot-toast";
import { useToasterStore } from "react-hot-toast";
import { AlertCircle, Check, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const HERITAGE_GOLD = "#c5a059";
const HERITAGE_NAVY = "#14192f";

const TOAST_SOUND_GAP_MS = 180;

type FeedbackTone = "success" | "error" | "loading" | "default";

const TOAST_SURFACE = "#fcf9f8";
const TOAST_OUTLINE = "#c4c6cf";
const TOAST_ON_VARIANT = "#44474e";

const TOAST_META: Record<
  FeedbackTone,
  {
    label: string;
    iconTone: string;
    accent: string;
    progress: string;
  }
> = {
  success: {
    label: "Confirmed",
    iconTone: "text-[#c5a059]",
    accent: "bg-[#c5a059]",
    progress: "bg-[#c5a059]/70",
  },
  error: {
    label: "Attention",
    iconTone: "text-[#1a2b48]",
    accent: "bg-[#1a2b48]",
    progress: "bg-[#1a2b48]/70",
  },
  loading: {
    label: "Please wait",
    iconTone: "text-[#c5a059]",
    accent: "bg-[#c5a059]",
    progress: "bg-[#c5a059]/70",
  },
  default: {
    label: "Notice",
    iconTone: "text-[#c5a059]",
    accent: "bg-[#c5a059]",
    progress: "bg-[#c5a059]/70",
  },
};

function canUseMotionFeedback(): boolean {
  return (
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function triggerToastHaptic(tone: FeedbackTone): void {
  if (
    !canUseMotionFeedback() ||
    typeof navigator === "undefined" ||
    !("vibrate" in navigator)
  )
    return;
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
    window.AudioContext ||
    (
      window as Window &
        typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const frequency =
      tone === "success" ? 880
      : tone === "error" ? 320
      : tone === "loading" ? 520
      : 640;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.038, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.16);
    oscillator.onended = () => {
      void ctx.close();
    };
  } catch {
    // Browser blocked audio; silent fallback.
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

function ToastIconBlock({ t }: { t: Toast }) {
  const tone = toneFor(t.type);
  const meta = TOAST_META[tone];

  if (t.icon !== undefined) {
    return (
      <div
        className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px]"
        style={{ backgroundColor: TOAST_SURFACE }}
      >
        {typeof t.icon === "string" ?
          <span className="text-base">{t.icon}</span>
        : t.icon}
      </div>
    );
  }

  return (
    <div
      className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px]"
      style={{ backgroundColor: TOAST_SURFACE }}
    >
      {t.type === "success" && (
        <Check className={cn("h-6 w-6", meta.iconTone)} strokeWidth={2} aria-hidden />
      )}
      {t.type === "error" && (
        <AlertCircle className={cn("h-6 w-6", meta.iconTone)} strokeWidth={2} aria-hidden />
      )}
      {t.type === "loading" && (
        <Loader2
          className={cn("h-6 w-6 animate-spin", meta.iconTone)}
          strokeWidth={2}
          aria-hidden
        />
      )}
      {(t.type === "blank" || t.type === "custom") && (
        <Sparkles className={cn("h-6 w-6", meta.iconTone)} strokeWidth={1.75} aria-hidden />
      )}
    </div>
  );
}

function ToastCard({
  toast: t,
  stackIndex,
}: {
  toast: Toast;
  stackIndex: number;
}) {
  const resolved = resolveValue(t.message, t);
  const { title, description } = splitToastContent(resolved);
  const tone = toneFor(t.type);
  const meta = TOAST_META[tone];
  const clampedStackIndex = Math.max(0, Math.min(stackIndex, 3));
  const stackScale = 1 - clampedStackIndex * 0.018;
  const stackOpacity = 1 - clampedStackIndex * 0.05;
  const stackShadow =
    clampedStackIndex === 0 ?
      "0px 10px 25px rgba(26, 43, 72, 0.08)"
    : clampedStackIndex === 1 ? "0px 8px 20px rgba(26, 43, 72, 0.06)"
    : "0px 6px 16px rgba(26, 43, 72, 0.05)";

  const hasDescription =
    description != null &&
    (typeof description === "string" ? description.trim().length > 0 : true);

  const showProgress =
    t.type !== "loading" &&
    typeof t.duration === "number" &&
    t.duration > 0 &&
    t.duration < Number.MAX_SAFE_INTEGER;

  const mergedStyle: CSSProperties = {
    ...(t.style as CSSProperties),
    background: "#ffffff",
    boxShadow: undefined,
    ["--toast-stack-scale" as string]: String(stackScale),
    ["--toast-stack-shadow" as string]: stackShadow,
    ...(t.visible ? { opacity: stackOpacity } : {}),
  };

  return (
    <div
      className={cn(
        "hor-toast-enter pointer-events-auto relative box-border flex w-full max-w-[360px] shrink-0 items-center gap-4 overflow-hidden rounded-[4px] border bg-white px-4 py-3 transition-[opacity,transform] duration-300 ease-out",
        hasDescription && "items-start",
        t.visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{
        ...mergedStyle,
        borderColor: TOAST_OUTLINE,
        boxShadow: stackShadow,
      }}
    >
      <div
        className={cn("absolute bottom-0 left-0 top-0 w-[3px]", meta.accent)}
        aria-hidden
      />

      <ToastIconBlock t={t} />

      <div
        {...t.ariaProps}
        className="relative z-[1] min-w-0 flex-1 pr-6 text-left"
      >
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c5a059]">
          {meta.label}
        </p>
        <p className="font-serif text-base italic leading-tight text-[#1a2b48]">
          {title}
        </p>
        {hasDescription && (
          <p
            className="mt-1 font-sans text-[13px] leading-relaxed whitespace-pre-line"
            style={{ color: TOAST_ON_VARIANT }}
          >
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className={cn(
          "relative z-[2] flex shrink-0 items-center justify-center p-1 text-[#44474e] transition-colors hover:text-[#1a2b48] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c5a059]/40",
          hasDescription && "self-start",
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>

      {showProgress && t.visible && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-100"
          aria-hidden
        >
          <div
            className={cn("hor-toast-progress h-full w-full", meta.progress)}
            style={{ animationDuration: `${t.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export default function AppToaster() {
  const { toasts } = useToasterStore();
  const stackedToasts = toasts.filter(
    (item) => item.visible || typeof item.height === "number",
  );
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
      position="top-right"
      reverseOrder={false}
      gutter={10}
      containerClassName="hor-toast-container !z-[10050]"
      containerStyle={{
        top: "calc(env(safe-area-inset-top, 0px) + 5.25rem)",
        right: "max(env(safe-area-inset-right, 0px), 14px)",
      }}
      toastOptions={{
        duration: 4200,
        className: "!bg-transparent !p-0 !shadow-none !border-0",
        style: { background: "transparent", boxShadow: "none", padding: 0 },
        success: {
          duration: 3800,
          iconTheme: { primary: HERITAGE_GOLD, secondary: "#ffffff" },
        },
        error: {
          duration: 4800,
          iconTheme: { primary: HERITAGE_NAVY, secondary: "#ffffff" },
        },
        loading: {
          iconTheme: { primary: HERITAGE_GOLD, secondary: "#ffffff" },
        },
      }}
    >
      {(t) => {
        const stackIndex = Math.max(
          0,
          stackedToasts.findIndex((item) => item.id === t.id),
        );
        return <ToastCard toast={t} stackIndex={stackIndex} />;
      }}
    </Toaster>
  );
}

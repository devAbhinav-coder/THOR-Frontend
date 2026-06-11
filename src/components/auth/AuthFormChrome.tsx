"use client";

import { cn } from "@/lib/utils";
import { authFormShell, authFormWrap } from "@/lib/authFormShell";
import { authGoldRule, authModalEyebrow } from "@/lib/authHeritageTheme";

type RootProps = {
  embedded?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function AuthFormRoot({ embedded, children, className }: RootProps) {
  return (
    <div className={cn(authFormWrap(embedded), className)}>
      <div className={authFormShell(embedded)}>{children}</div>
    </div>
  );
}

type HeaderProps = {
  embedded?: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

export function AuthFormHeader({ embedded, title, subtitle, icon }: HeaderProps) {
  if (embedded) {
    return subtitle ?
        <p className="mb-3 text-center text-xs leading-relaxed text-gray-500 lg:text-left">
          {subtitle}
        </p>
      : null;
  }

  return (
    <div className="mb-6 text-center sm:mb-8">
      {icon ?
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center border border-[#c5a059]/30 bg-[#c5a059]/10 text-[#c5a059]">
          {icon}
        </div>
      : null}
      <p className={authModalEyebrow}>Account</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-white">{title}</h1>
      <div className={cn(authGoldRule, "mt-3")} aria-hidden />
      {subtitle ?
        <p className="mt-3 text-sm text-white/50">{subtitle}</p>
      : null}
    </div>
  );
}

export function AuthFormDivider({
  embedded,
  label = "or continue with",
}: {
  embedded?: boolean;
  label?: string;
}) {
  const chipBg = embedded ? "bg-[#faf9f7]" : "bg-navy-900";
  const line = embedded ? "border-gray-200" : "border-white/10";
  const text = embedded ? "text-gray-400" : "text-white/35";

  return (
    <div className="relative my-3 sm:my-4">
      <div className="absolute inset-0 flex items-center">
        <div className={cn("w-full border-t", line)} />
      </div>
      <div className="relative flex justify-center text-[9px] font-semibold uppercase tracking-[0.22em]">
        <span className={cn("px-3", chipBg, text)}>{label}</span>
      </div>
    </div>
  );
}

export function AuthStepBar({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div
      className="mb-2 flex gap-1"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-0.5 flex-1 transition-colors duration-300",
            i <= current ? "bg-[#c5a059]" : "bg-gray-200",
          )}
        />
      ))}
    </div>
  );
}

export function AuthFormFooter({
  embedded,
  children,
}: {
  embedded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 border-t pt-3 text-center text-sm",
        embedded ? "border-gray-100 text-gray-500" : "border-white/10 text-white/45",
      )}
    >
      {children}
    </div>
  );
}

export function AuthBackButton({
  embedded,
  onClick,
  children,
}: {
  embedded?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-1.5 py-2",
        embedded ?
          "text-xs text-gray-500 transition-colors hover:text-navy-900"
        : "text-xs text-white/40 transition-colors hover:text-white/70",
      )}
    >
      {children}
    </button>
  );
}

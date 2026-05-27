"use client";

import { cn } from "@/lib/utils";
import { authFormShell, authFormWrap } from "@/lib/authFormShell";

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
        <p className="text-sm text-gray-500 text-center mb-4 leading-snug">{subtitle}</p>
      : null;
  }

  return (
    <div className="text-center mb-6 sm:mb-8">
      {icon ?
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/15 text-brand-500">
          {icon}
        </div>
      : null}
      <h1 className="text-2xl font-serif font-bold text-white">{title}</h1>
      {subtitle ?
        <p className="text-white/50 mt-1.5 text-sm">{subtitle}</p>
      : null}
    </div>
  );
}

export function AuthFormDivider({
  embedded,
  label = "or",
}: {
  embedded?: boolean;
  label?: string;
}) {
  const chipBg = embedded ? "bg-[#faf9f7]" : "bg-navy-900";
  const line = embedded ? "border-gray-200" : "border-white/10";
  const text = embedded ? "text-gray-400" : "text-white/35";

  return (
    <div className="relative my-4 sm:my-5">
      <div className={cn("absolute inset-0 flex items-center")}>
        <div className={cn("w-full border-t", line)} />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase tracking-[0.14em] font-medium">
        <span className={cn("px-2.5", chipBg, text)}>{label}</span>
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
      className="flex gap-1.5 mb-4"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
            i <= current ? "bg-brand-600" : "bg-gray-200",
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
        "mt-5 pt-4 text-center text-sm border-t",
        embedded ? "border-gray-100 text-gray-500" : "border-white/10 text-white/40",
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
        "flex w-full items-center justify-center gap-1.5 py-1",
        embedded ?
          "text-sm text-gray-500 hover:text-navy-900"
        : "text-sm text-white/40 hover:text-white/70",
      )}
    >
      {children}
    </button>
  );
}

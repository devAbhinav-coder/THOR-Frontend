"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function AccountFormField({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={fieldId}
        className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-account-on-surface-variant"
      >
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          "w-full bg-transparent border-0 border-b border-account-outline-variant/50 pb-2 text-account-primary text-base focus:outline-none focus:border-account-secondary transition-colors placeholder:text-account-outline-variant/70 disabled:text-account-on-surface-variant disabled:cursor-not-allowed",
          error && "border-red-400",
        )}
        {...props}
      />
      {hint}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

type TextAreaProps = {
  label: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AccountFormTextarea({
  label,
  error,
  className,
  id,
  ...props
}: TextAreaProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={fieldId}
        className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-account-on-surface-variant"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cn(
          "w-full bg-transparent border-0 border-b border-account-outline-variant/50 pb-2 text-account-primary text-base focus:outline-none focus:border-account-secondary transition-colors resize-none placeholder:text-account-outline-variant/70",
          error && "border-red-400",
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

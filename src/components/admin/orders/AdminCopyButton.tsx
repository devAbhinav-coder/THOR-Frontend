"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  /** Toast text */
  successText?: string;
  className?: string;
  /** icon-only compact button */
  iconOnly?: boolean;
};

export default function AdminCopyButton({
  value,
  label = "Copy",
  successText,
  className,
  iconOnly,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (successText) toast.success(successText);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type='button'
      onClick={() => void copy()}
      aria-label={iconOnly ? label : undefined}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-[11px] font-semibold transition-colors",
        iconOnly ?
          "h-6 w-6 justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100"
        : "px-1.5 py-0.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100",
        copied && "text-emerald-700",
        className,
      )}
    >
      {copied ?
        <Check className='h-3.5 w-3.5' aria-hidden />
      : <Copy className='h-3.5 w-3.5' aria-hidden />}
      {!iconOnly ? (copied ? "Copied" : label) : null}
    </button>
  );
}

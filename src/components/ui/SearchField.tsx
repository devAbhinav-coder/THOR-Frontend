"use client";

import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional: show spinner (e.g. while API request in flight) */
  isLoading?: boolean;
  /** Tighter height and padding for dense admin toolbars */
  size?: "default" | "compact";
  className?: string;
  inputClassName?: string;
  id?: string;
  "aria-label"?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  isLoading = false,
  size = "default",
  className,
  inputClassName,
  id,
  "aria-label": ariaLabel = "Search",
}: SearchFieldProps) {
  const compact = size === "compact";
  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400",
          compact ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4",
        )}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={ariaLabel}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm transition-[box-shadow,border-color] [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden",
          compact ?
            "h-9 py-0 pl-8 pr-9 text-xs"
          : "py-2.5 pl-9 pr-11 text-sm",
          "placeholder:text-gray-400",
          "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25",
          inputClassName,
        )}
      />
      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
        )}
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

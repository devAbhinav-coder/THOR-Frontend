"use client";

import { useState, memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const StarSelector = memo(function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} star`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hovered || value) >= n
                ? "fill-gold-400 text-gold-400"
                : "fill-gray-200 text-gray-200",
            )}
          />
        </button>
      ))}
    </div>
  );
});

export const RatingBar = memo(function RatingBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors: Record<string, string> = {
    "5": "bg-[#10b981]",
    "4": "bg-[#10b981]",
    "3": "bg-[#ffb400]",
    "2": "bg-[#ff8a00]",
    "1": "bg-[#f44336]",
  };
  const labels: Record<string, string> = {
    "5": "Excellent",
    "4": "Very Good",
    "3": "Good",
    "2": "Average",
    "1": "Poor",
  };

  return (
    <div className="flex items-center gap-4 group cursor-default">
      <span className="text-[13px] font-medium text-gray-600 w-20 shrink-0">
        {labels[label] || label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colors[label] || "bg-brand-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] font-bold text-gray-400 w-10 shrink-0 text-right group-hover:text-gray-900 transition-colors">
        {count}
      </span>
    </div>
  );
});

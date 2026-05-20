"use client";

import { useMemo } from "react";

type Props = {
  password: string;
  className?: string;
  variant?: "dark" | "light";
};

function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 5);
}

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
const COLORS = [
  "bg-red-500",
  "bg-red-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-emerald-500",
  "bg-emerald-600",
];

export function PasswordStrengthMeter({
  password,
  className,
  variant = "dark",
}: Props) {
  const score = useMemo(() => scorePassword(password), [password]);
  const pct = password ? ((score + 1) / 6) * 100 : 0;
  const track = variant === "light" ? "bg-gray-200" : "bg-white/10";
  const label = variant === "light" ? "text-gray-500" : "text-white/50";
  const value = variant === "light" ? "text-gray-800" : "text-white/80";

  if (!password) return null;

  return (
    <div className={className ?? "space-y-1.5"} aria-live="polite">
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${track}`}>
        <div
          className={`h-full transition-all duration-300 ${COLORS[score] ?? COLORS[0]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs ${label}`}>
        Strength: <span className={value}>{LABELS[score]}</span>
      </p>
    </div>
  );
}

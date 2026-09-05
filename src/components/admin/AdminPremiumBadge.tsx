import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact badge for Premium Edit SKUs across admin tables. */
export default function AdminPremiumBadge({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-800",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        className,
      )}
    >
      <Crown className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} aria-hidden />
      {compact ? "Premium" : "Premium Edit"}
    </span>
  );
}

export function isAdminPremiumProduct(p: {
  isPremium?: boolean;
  category?: string;
}): boolean {
  return (
    p.isPremium === true ||
    String(p.category || "").trim().toLowerCase() === "premium"
  );
}

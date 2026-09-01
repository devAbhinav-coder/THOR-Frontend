import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export const PDP_TRUST_BADGES = [
  {
    icon: BadgeCheck,
    label: "100% Authentic",
    mobileLine1: "100%",
    mobileLine2: "Authentic",
    sub: "Original product",
  },
  {
    icon: RotateCcw,
    label: "Easy 5-Day Return",
    mobileLine1: "Easy",
    mobileLine2: "5-Day Return",
    sub: "Hassle-free",
  },
  {
    icon: ShieldCheck,
    label: "Secure Payment",
    mobileLine1: "Secure",
    mobileLine2: "Payment",
    sub: "Encrypted checkout",
  },
  {
    icon: Truck,
    label: "Free Shipping",
    mobileLine1: "Free",
    mobileLine2: "Shipping",
    sub: "Above ₹1,099",
  },
] as const;

type PdpTrustBadgesProps = {
  className?: string;
  compact?: boolean;
};

export function PdpTrustBadges({ className, compact }: PdpTrustBadgesProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1 sm:gap-3",
        className,
      )}
    >
      {PDP_TRUST_BADGES.map(
        ({ icon: Icon, label, mobileLine1, mobileLine2, sub }) => (
          <div
            key={label}
            className={cn(
              "flex min-w-0 items-center gap-1 rounded-sm border border-[#c5a059]/20 bg-[#faf8f4] px-1 py-1.5 text-left sm:gap-2 sm:px-3 sm:py-2.5",
              compact && "sm:py-2",
            )}
          >
            <Icon
              className="h-3 w-3 shrink-0 text-[#c5a059] sm:h-4 sm:w-4"
              strokeWidth={1.35}
              aria-hidden
            />
            <div className="min-w-0 leading-tight">
              <div className="sm:hidden">
                <span className="block text-[7px] font-semibold uppercase leading-[1.15] tracking-[0.03em] text-navy-900">
                  {mobileLine1}
                </span>
                <span className="block text-[7px] font-semibold uppercase leading-[1.15] tracking-[0.03em] text-navy-900">
                  {mobileLine2}
                </span>
              </div>
              <span className="hidden text-[10px] font-semibold uppercase leading-snug tracking-[0.1em] text-navy-900 sm:block">
                {label}
              </span>
              {!compact ?
                <span className="mt-0.5 hidden text-[9px] leading-tight text-gray-500 sm:block">
                  {sub}
                </span>
              : null}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

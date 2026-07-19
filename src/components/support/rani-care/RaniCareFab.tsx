"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { raniEyebrow, raniFab, raniFabLabel } from "./raniCareHeritageTheme";

type Props = {
  onOpen: () => void;
};

export function RaniCareFab({ onOpen }: Props) {
  return (
    <div className="ml-auto flex w-fit flex-col items-end gap-2 motion-reduce:transition-none">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            raniFab,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/50 focus-visible:ring-offset-2",
          )}
          aria-label="Open customer support chat"
        >
          <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={1.75} />
        </button>
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 border border-white bg-[#c5a059] sm:h-2.5 sm:w-2.5"
          title="Support online"
          aria-hidden
        />
      </div>
      <button type="button" onClick={onOpen} className={raniFabLabel}>
        <span className={raniEyebrow}>Concierge</span>
        <span className="text-navy-900">Rani Care</span>
      </button>
    </div>
  );
}

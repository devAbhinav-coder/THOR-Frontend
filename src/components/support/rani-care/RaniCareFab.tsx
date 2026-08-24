"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { raniFab } from "./raniCareHeritageTheme";

type Props = {
  isDragging?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<"button">;

export function RaniCareFab({
  isDragging = false,
  className,
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        raniFab,
        "touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/50 focus-visible:ring-offset-2",
        isDragging ?
          "cursor-grabbing scale-[1.04] shadow-[0_16px_40px_-10px_rgba(20,25,47,0.55)]"
        : "cursor-grab active:scale-[0.97]",
        className,
      )}
      aria-label="Open Rani Care support chat. Drag to move."
    >
      <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      <span
        className="absolute right-0.5 top-0.5 h-2 w-2 border border-white bg-[#c5a059]"
        title="Support online"
        aria-hidden
      />
    </button>
  );
}

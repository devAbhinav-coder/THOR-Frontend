"use client";

import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { raniAvatarBot, raniBotBubble } from "./raniCareHeritageTheme";

function TypingDots() {
  return (
    <span className="inline-flex h-4 items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-bounce bg-[#c5a059] motion-reduce:animate-none"
          style={{ animationDelay: `${i * 140}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

type Props = {
  loadingOrders: boolean;
  animate?: boolean;
};

export function RaniCareTypingIndicator({ loadingOrders, animate = true }: Props) {
  return (
    <div
      className={cn(
        "flex gap-2",
        animate && "animate-rani-msg-bot motion-reduce:animate-none",
      )}
    >
      <div className={raniAvatarBot}>
        <Bot className="h-4 w-4" />
      </div>
      <div
        className={cn(
          raniBotBubble,
          "inline-flex min-w-[120px] items-center gap-2.5 text-sm text-gray-500",
        )}
      >
        {loadingOrders ?
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#c5a059] motion-reduce:animate-none" />
            <span className="text-[13px]">Fetching your orders…</span>
          </>
        : <TypingDots />}
      </div>
    </div>
  );
}

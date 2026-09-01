"use client";

import { cn } from "@/lib/utils";

type PdpInstagramReelEmbedProps = {
  embedUrl: string;
  title: string;
  /** `modal` = 9:16 card; `inline` = wide story-column preview */
  variant?: "modal" | "inline";
  loaded?: boolean;
  onLoad?: () => void;
  className?: string;
};

const MODAL_ZOOM = {
  transform: "scale(1.48)",
  transformOrigin: "50% 38%",
} as const;

const INLINE_ZOOM_CLASS =
  "origin-[50%_38%] scale-[1.42] -translate-y-[15%] sm:-translate-y-[10%]";

export function PdpInstagramReelEmbed({
  embedUrl,
  title,
  variant = "modal",
  loaded = true,
  onLoad,
  className,
}: PdpInstagramReelEmbedProps) {
  const isModal = variant === "modal";

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      <div
        className={cn("absolute inset-0", !isModal && INLINE_ZOOM_CLASS)}
        style={isModal ? MODAL_ZOOM : undefined}
      >
        <iframe
          src={embedUrl}
          title={title}
          className={cn(
            "pointer-events-auto absolute inset-0 h-full w-full border-0 transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; unload'
          allowFullScreen
          loading={isModal ? "eager" : "lazy"}
          scrolling='no'
          onLoad={onLoad}
        />
      </div>
    </div>
  );
}

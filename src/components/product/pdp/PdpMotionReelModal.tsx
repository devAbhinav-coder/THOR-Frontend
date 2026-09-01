"use client";

import { useEffect, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { PdpInstagramReelEmbed } from "./PdpInstagramReelEmbed";
import { PdpMotionModalShell } from "./PdpMotionModalShell";

type PdpMotionReelModalProps = {
  open: boolean;
  embedUrl: string;
  watchUrl: string;
  title: string;
  onClose: () => void;
};

export function PdpMotionReelModal({
  open,
  embedUrl,
  watchUrl,
  title,
  onClose,
}: PdpMotionReelModalProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) setLoaded(false);
  }, [open]);

  return (
    <PdpMotionModalShell
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white/90"
        >
          <Instagram className="h-3.5 w-3.5" aria-hidden />
          Open on Instagram
        </a>
      }
    >
      <div
        className="relative mx-auto overflow-hidden rounded-2xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        style={{
          width: "min(86vw, 342px, calc((100dvh - 6.5rem) * 9 / 16))",
          aspectRatio: "9 / 16",
        }}
      >
        {!loaded ?
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
            <Loader2
              className="h-7 w-7 animate-spin text-[#c5a059]/80"
              aria-hidden
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Loading reel
            </p>
          </div>
        : null}

        <PdpInstagramReelEmbed
          embedUrl={embedUrl}
          title={title}
          variant="modal"
          loaded={loaded}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </PdpMotionModalShell>
  );
}

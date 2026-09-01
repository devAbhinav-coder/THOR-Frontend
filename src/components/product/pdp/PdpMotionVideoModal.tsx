"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PdpMotionModalShell } from "./PdpMotionModalShell";

type PdpMotionVideoModalProps = {
  open: boolean;
  videoUrl: string;
  title: string;
  onClose: () => void;
};

type VideoDims = { width: number; height: number };

function isPortraitVideo(dims: VideoDims | null): boolean {
  if (!dims?.width || !dims?.height) return false;
  return dims.width / dims.height < 0.95;
}

export function PdpMotionVideoModal({
  open,
  videoUrl,
  title,
  onClose,
}: PdpMotionVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [dims, setDims] = useState<VideoDims | null>(null);

  useEffect(() => {
    if (!open) {
      setReady(false);
      setDims(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    setReady(false);
    setDims(null);
    void videoRef.current.play().catch(() => {
      /* controls still work if autoplay blocked */
    });
  }, [open, videoUrl]);

  const portrait = isPortraitVideo(dims);

  const frameStyle = useMemo(() => {
    const maxHeight = "calc(100dvh - 6.5rem)";

    if (!dims) {
      return {
        width: "min(86vw, 342px, calc((100dvh - 6.5rem) * 9 / 16))",
        aspectRatio: "9 / 16",
      } as const;
    }

    if (portrait) {
      return {
        aspectRatio: `${dims.width} / ${dims.height}`,
        maxHeight,
        width: `min(86vw, 400px, calc(${maxHeight} * ${dims.width} / ${dims.height}))`,
      } as const;
    }

    return {
      aspectRatio: `${dims.width} / ${dims.height}`,
      maxHeight,
      maxWidth: "min(92vw, 920px)",
      width: "min(92vw, 920px)",
    } as const;
  }, [dims, portrait]);

  return (
    <PdpMotionModalShell
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
          {title}
        </p>
      }
    >
      <div
        className="relative mx-auto overflow-hidden rounded-2xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        style={frameStyle}
      >
        {!ready ?
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
            <Loader2
              className="h-7 w-7 animate-spin text-[#c5a059]/80"
              aria-hidden
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Loading video
            </p>
          </div>
        : null}

        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          autoPlay
          loop
          muted
          className={cn(
            "absolute inset-0 h-full w-full bg-black transition-opacity duration-300",
            portrait ? "object-cover" : "object-contain",
            ready ? "opacity-100" : "opacity-0",
          )}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            setDims({
              width: el.videoWidth,
              height: el.videoHeight,
            });
          }}
          onLoadedData={() => setReady(true)}
        />

        {ready ?
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-[#c5a059]/70"
            aria-hidden
          />
        : null}
      </div>
    </PdpMotionModalShell>
  );
}

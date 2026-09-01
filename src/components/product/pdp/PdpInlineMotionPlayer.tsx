"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PDP_INLINE_MOTION_LOOP_SEC } from "./constants";
import { PdpInstagramReelEmbed } from "./PdpInstagramReelEmbed";

type PdpInlineMotionPlayerProps = {
  kind: "video" | "reel";
  videoUrl?: string;
  embedUrl?: string;
  posterUrl?: string;
  title: string;
  onExpand?: () => void;
};

export function PdpInlineMotionPlayer({
  kind,
  videoUrl,
  embedUrl,
  posterUrl,
  title,
  onExpand,
}: PdpInlineMotionPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (kind !== "video" || !videoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const loopSegment = () => {
      if (video.duration && video.duration <= PDP_INLINE_MOTION_LOOP_SEC + 0.25) {
        video.loop = true;
        return;
      }
      if (video.currentTime >= PDP_INLINE_MOTION_LOOP_SEC) {
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
    };

    const onMeta = () => {
      if (video.duration && video.duration <= PDP_INLINE_MOTION_LOOP_SEC + 0.25) {
        video.loop = true;
      }
    };

    video.addEventListener("timeupdate", loopSegment);
    video.addEventListener("loadedmetadata", onMeta);
    void video.play().catch(() => {});

    return () => {
      video.removeEventListener("timeupdate", loopSegment);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [kind, videoUrl]);

  return (
    <div className="group relative min-h-[260px] overflow-hidden border border-gray-200 bg-black sm:min-h-[280px] lg:col-span-4">
      {kind === "video" && videoUrl ?
        <>
          {posterUrl && !videoReady ?
            <Image
              src={posterUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
              aria-hidden
            />
          : null}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            onLoadedData={() => setVideoReady(true)}
          />
        </>
      : kind === "reel" && embedUrl ?
        <>
          {posterUrl ?
            <Image
              src={posterUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="pointer-events-none object-cover opacity-40"
              aria-hidden
            />
          : null}
          <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
            <PdpInstagramReelEmbed
              embedUrl={embedUrl}
              title={title}
              variant="inline"
            />
          </div>
        </>
      : posterUrl ?
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
      : null}

      {onExpand ?
        <button
          type="button"
          onClick={onExpand}
          className="absolute inset-0 z-20 cursor-pointer bg-transparent transition-colors hover:bg-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c5a059]"
          aria-label="Open fullscreen motion video"
        />
      : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-navy-900/80 to-transparent px-4 pb-3 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
          {title}
        </p>
      </div>
    </div>
  );
}

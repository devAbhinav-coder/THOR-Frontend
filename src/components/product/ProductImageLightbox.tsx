"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxImage = { url: string; alt?: string };

const ZOOM_SCALE = 2.35;

interface ProductImageLightboxProps {
  images: LightboxImage[];
  productName: string;
  isSquareAspect?: boolean;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  onActiveIndexChange?: (index: number) => void;
}

export default function ProductImageLightbox({
  images,
  productName,
  isSquareAspect = false,
  open,
  initialIndex,
  onClose,
  onActiveIndexChange,
}: ProductImageLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(true);
  const [hoveringZoom, setHoveringZoom] = useState(false);
  const [focal, setFocal] = useState({ x: 50, y: 50 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (open) {
      setIdx(initialIndex);
      setFocal({ x: 50, y: 50 });
      setHoveringZoom(false);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = useCallback(
    (next: number) => {
      const len = images.length;
      if (!len) return;
      const i = ((next % len) + len) % len;
      setIdx(i);
      setFocal({ x: 50, y: 50 });
      setHoveringZoom(false);
      onActiveIndexChange?.(i);
    },
    [images.length, onActiveIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "ArrowRight") go(idx + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go, idx]);

  const updateFocalFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = mainRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(
        100,
        Math.max(0, ((clientX - r.left) / r.width) * 100),
      );
      const y = Math.min(
        100,
        Math.max(0, ((clientY - r.top) / r.height) * 100),
      );
      setFocal({ x, y });
    },
    [],
  );

  const desktopZoom = !coarsePointer && hoveringZoom;
  const scale = desktopZoom ? ZOOM_SCALE : 1;

  const onMainMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (coarsePointer) return;
    updateFocalFromClient(e.clientX, e.clientY);
  };

  const onMainTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const onMainTouchMove = (e: React.TouchEvent) => {
    if (coarsePointer || e.touches.length !== 1) return;
    updateFocalFromClient(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onMainTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || images.length <= 1) {
      setTouchStartX(null);
      return;
    }
    const end = e.changedTouches[0]?.clientX;
    if (end == null) {
      setTouchStartX(null);
      return;
    }
    const dx = end - touchStartX;
    if (Math.abs(dx) > 48) {
      if (dx < 0) go(idx + 1);
      else go(idx - 1);
    }
    setTouchStartX(null);
  };

  if (!mounted || !open || images.length === 0) return null;

  const cur = images[idx];
  const aspectClass = isSquareAspect ? "aspect-square" : "aspect-[3/4]";

  const modal = (
    <div
      className='fixed inset-0 z-[100] flex flex-col bg-white sm:flex-row sm:bg-navy-950/95 sm:p-3 lg:p-5'
      role='dialog'
      aria-modal='true'
      aria-label='Product image gallery'
    >
      <button
        type='button'
        onClick={onClose}
        className='absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-gray-100 sm:right-5 sm:top-5 sm:bg-white/10 sm:text-white sm:ring-white/20 sm:hover:bg-white/20'
        aria-label='Close gallery'
      >
        <X className='h-5 w-5' />
      </button>

      {images.length > 1 && (
        <div className='flex shrink-0 gap-2 overflow-x-auto overflow-y-hidden px-3 pb-1 pt-12 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden'>
          {images.map((img, i) => (
            <button
              key={i}
              type='button'
              onClick={() => go(i)}
              className={cn(
                "relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 transition-all",
                i === idx ?
                  "border-brand-500 ring-2 ring-brand-200"
                : "border-gray-200",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=''
                className={cn(
                  "h-full w-full",
                  isSquareAspect ? "object-cover" : "object-contain",
                )}
              />
            </button>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className='ml-0 mr-2 mt-16 hidden max-h-[85vh] w-[5.5rem] shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:ml-0 sm:mt-0 sm:flex sm:self-center sm:pt-0 lg:w-24'>
          {images.map((img, i) => (
            <button
              key={i}
              type='button'
              onClick={() => go(i)}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border-2 bg-white/10 transition-all",
                isSquareAspect ? "aspect-square" : "aspect-[3/4]",
                i === idx ?
                  "border-brand-400 ring-2 ring-brand-300/40"
                : "border-white/20 hover:border-white/50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=''
                className={cn(
                  "h-full w-full",
                  isSquareAspect ? "object-cover" : "object-contain",
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className='flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-2 pb-6 pt-2 sm:px-4 sm:pb-4 sm:pt-4'>
        <p className='mb-2 hidden text-center text-xs text-white/70 sm:block'>
          {!coarsePointer ?
            "Hover the image to zoom "
          : "Swipe left or right on the image for more photos"}
        </p>

        <div className='flex w-full max-w-5xl flex-1 flex-col items-center gap-3 min-[1100px]:flex-row min-[1100px]:items-stretch min-[1100px]:justify-center min-[1100px]:gap-4'>
          <div
            ref={mainRef}
            className={cn(
              "relative w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-100 sm:bg-white/5 ring-1 ring-black/5 sm:ring-white/10",
              aspectClass,
              "max-h-[min(78vh,900px)] min-[1100px]:max-h-[85vh] min-[1100px]:flex-1",
              !coarsePointer ? "cursor-crosshair" : "cursor-default",
            )}
            onMouseEnter={() => !coarsePointer && setHoveringZoom(true)}
            onMouseMove={onMainMouseMove}
            onMouseLeave={() => {
              setHoveringZoom(false);
              setFocal({ x: 50, y: 50 });
            }}
            onTouchStart={onMainTouchStart}
            onTouchMove={onMainTouchMove}
            onTouchEnd={onMainTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cur.url}
              alt={cur.alt || `${productName} — image ${idx + 1}`}
              draggable={false}
              className={cn(
                "h-full w-full select-none transition-transform duration-100 ease-out",
                isSquareAspect ? "object-cover" : "object-contain",
              )}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${focal.x}% ${focal.y}%`,
              }}
            />

            {!coarsePointer && (
              <div
                className={cn(
                  "pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-opacity",
                  hoveringZoom ?
                    "bg-black/50 opacity-100"
                  : "bg-black/45 opacity-90",
                )}
              >
                <ZoomIn className='h-3.5 w-3.5 shrink-0' />
                {hoveringZoom ? "Move to pan zoom" : "Hover to zoom"}
              </div>
            )}
          </div>

          {!coarsePointer && (
            <div
              className={cn(
                "relative hidden w-full max-w-md overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5 min-[1100px]:block min-[1100px]:max-h-[85vh] min-[1100px]:flex-1",
                aspectClass,
                hoveringZoom ? "opacity-100" : "opacity-40",
              )}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cur.url}
                alt=''
                className={cn(
                  "h-full w-full select-none transition-transform duration-100 ease-out",
                  isSquareAspect ? "object-cover" : "object-contain",
                )}
                style={{
                  transform: `scale(${hoveringZoom ? ZOOM_SCALE * 1.12 : 1})`,
                  transformOrigin: `${focal.x}% ${focal.y}%`,
                }}
              />
              {!hoveringZoom && (
                <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-center text-sm font-medium text-white/90'>
                  Hover main image
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

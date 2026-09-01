"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HorizontalScrollSurface } from "@/components/ui/HorizontalScrollSurface";
import Image from "next/image";
import { Package, Heart, Share2, Check, Star, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinePointerHover } from "@/hooks/useFinePointerHover";
import ProductImageLightbox from "@/components/product/ProductImageLightbox";
import { PDP_MAIN_LENS_PX, PDP_MAIN_LENS_ZOOM } from "./constants";

export interface PdpImageGalleryProps {
  productId: string;
  /** Changes when color/images switch — resets selected thumbnail. */
  galleryKey?: string;
  name: string;
  images: { url: string; alt?: string }[];
  isGiftMarketingContext: boolean;
  isFeatured?: boolean;
  isOutOfStock: boolean;
  inWishlist: boolean;
  copied: boolean;
  onWishlist: () => void;
  onShare: () => void;
}

const SWIPE_THRESHOLD_PX = 48;

function thumbAspect(isGift: boolean) {
  return isGift ? ("1/1" as const) : ("3/4" as const);
}

export function PdpImageGallery({
  productId,
  galleryKey,
  name,
  images,
  isGiftMarketingContext,
  isFeatured,
  isOutOfStock,
  inWishlist,
  copied,
  onWishlist,
  onShare,
}: PdpImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const pdpMainImageRef = useRef<HTMLDivElement>(null);
  const pdpLensBoxRef = useRef<HTMLDivElement>(null);
  const pdpLensImgRef = useRef<HTMLImageElement>(null);
  const pdpLensMetricsRef = useRef<{
    mx: number;
    my: number;
    cw: number;
    ch: number;
  } | null>(null);
  const pdpLensRafRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pdpLensVisible, setPdpLensVisible] = useState(false);
  const hoverZoomEnabled = useFinePointerHover();
  const aspect = thumbAspect(isGiftMarketingContext);

  useEffect(() => {
    setSelectedImage(0);
    setImageLightboxOpen(false);
  }, [productId, galleryKey, images]);

  useEffect(() => {
    setPdpLensVisible(false);
    pdpLensMetricsRef.current = null;
    if (pdpLensRafRef.current != null) {
      cancelAnimationFrame(pdpLensRafRef.current);
      pdpLensRafRef.current = null;
    }
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (pdpLensRafRef.current != null) {
        cancelAnimationFrame(pdpLensRafRef.current);
      }
    };
  }, []);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImage((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImage((i) => (i + 1) % images.length);
  }, [images.length]);

  const flushPdpLensDom = () => {
    pdpLensRafRef.current = null;
    const m = pdpLensMetricsRef.current;
    const box = pdpLensBoxRef.current;
    const img = pdpLensImgRef.current;
    if (!m || !box || !img) return;
    const { mx, my, cw, ch } = m;
    const L = PDP_MAIN_LENS_PX;
    const z = PDP_MAIN_LENS_ZOOM;
    const left = Math.max(0, Math.min(cw - L, mx - L / 2));
    const top = Math.max(0, Math.min(ch - L, my - L / 2));
    box.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    img.style.width = `${cw * z}px`;
    img.style.height = `${ch * z}px`;
    img.style.transform = `translate3d(${L / 2 - mx * z}px, ${L / 2 - my * z}px, 0)`;
  };

  const onPdpMainImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hoverZoomEnabled || e.pointerType !== "mouse") return;
    const el = pdpMainImageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    if (mx < 0 || my < 0 || mx > r.width || my > r.height) {
      if (pdpLensRafRef.current != null) {
        cancelAnimationFrame(pdpLensRafRef.current);
        pdpLensRafRef.current = null;
      }
      setPdpLensVisible(false);
      pdpLensMetricsRef.current = null;
      return;
    }
    setPdpLensVisible(true);
    pdpLensMetricsRef.current = { mx, my, cw: r.width, ch: r.height };
    if (pdpLensRafRef.current == null) {
      pdpLensRafRef.current = requestAnimationFrame(flushPdpLensDom);
    }
  };

  const onPdpMainImagePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (pdpLensRafRef.current != null) {
      cancelAnimationFrame(pdpLensRafRef.current);
      pdpLensRafRef.current = null;
    }
    setPdpLensVisible(false);
    pdpLensMetricsRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    
    const endX = e.changedTouches[0]?.clientX ?? start.x;
    const endY = e.changedTouches[0]?.clientY ?? start.y;
    const dx = endX - start.x;
    const dy = endY - start.y;
    
    if (images.length > 1 && Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
      return;
    }

    const rect = pdpMainImageRef.current?.getBoundingClientRect();
    if (rect) {
      const tapX = endX - rect.left;
      if (images.length > 1 && tapX < rect.width * 0.3) {
        goPrev();
      } else if (images.length > 1 && tapX > rect.width * 0.7) {
        goNext();
      } else {
        setImageLightboxOpen(true);
      }
    }
  };

  const handleImageZoneClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: "prev" | "next" | "zoom",
  ) => {
    e.stopPropagation();
    if (action === "prev") goPrev();
    else if (action === "next") goNext();
    else setImageLightboxOpen(true);
  };

  const renderThumb = (
    img: { url: string; alt?: string },
    i: number,
    opts: { layout: "side" | "tablet"; sizes: string; widthClass: string },
  ) => (
    <button
      key={img.url || i}
      type='button'
      onMouseEnter={
        opts.layout === "side" && hoverZoomEnabled ?
          () => setSelectedImage(i)
        : undefined
      }
      onClick={() => setSelectedImage(i)}
      className={cn(
        "flex-shrink-0 overflow-hidden border-2 bg-gray-50 transition-all duration-150",
        opts.widthClass,
        i === selectedImage ?
          "border-[#c5a059] ring-1 ring-[#c5a059]/30"
        : "border-gray-200 hover:border-[#c5a059]/50",
      )}
      style={{ aspectRatio: aspect }}
    >
      <div className='relative h-full w-full'>
        <Image
          src={img.url}
          alt={img.alt || `${name} ${i + 1}`}
          fill
          sizes={opts.sizes}
          quality={opts.layout === "side" ? 90 : 88}
          className={isGiftMarketingContext ? "object-cover" : "object-contain"}
        />
      </div>
    </button>
  );

  return (
    <>
      <div className='relative flex min-w-0 gap-3.5 overflow-x-hidden overflow-y-visible lg:gap-5 lg:overflow-visible'>
        {images.length > 1 ?
          <div
            ref={thumbsRef}
            className='relative z-30 hidden w-[88px] flex-shrink-0 flex-col gap-2 overflow-y-auto scrollbar-hide lg:flex'
            style={{
              marginLeft:
                "calc(-1 * (max((100vw - 1280px) / 2, 0px) + 2rem) + 12px)",
            }}
          >
            {images.map((img, i) =>
              renderThumb(img, i, {
                layout: "side",
                sizes: "176px",
                widthClass: "w-full",
              }),
            )}
          </div>
        : null}

        <div className='min-w-0 flex-1 '>
          {images.length > 1 ?
            <HorizontalScrollSurface className='hidden w-full min-w-0 max-w-full gap-2 pb-1 scrollbar-hide md:flex lg:hidden'>
              {images.map((img, i) =>
                renderThumb(img, i, {
                  layout: "tablet",
                  sizes: "112px",
                  widthClass: "w-16",
                }),
              )}
            </HorizontalScrollSurface>
          : null}

          <div className='border border-[#c5a059]/40 bg-white p-0.5 sm:p-1'>
            <div
              ref={pdpMainImageRef}
              className={cn(
                "relative w-full touch-pan-y overflow-hidden bg-gray-50 ring-1 ring-[#c5a059]/20",
                hoverZoomEnabled && "md:cursor-crosshair",
              )}
              style={{ aspectRatio: aspect }}
              onPointerMove={onPdpMainImagePointerMove}
              onPointerLeave={onPdpMainImagePointerLeave}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {images.length > 0 ?
                <div 
                  className='absolute inset-0 z-0 flex transition-transform duration-300 ease-out will-change-transform'
                  style={{ transform: `translateX(-${selectedImage * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <div key={img.url || i} className='relative h-full w-full shrink-0'>
                      <Image
                        src={img.url}
                        alt={img.alt || `${name} ${i + 1}`}
                        fill
                        sizes='(max-width: 1024px) 100vw, (max-width: 1536px) 50vw, 720px'
                        quality={92}
                        className={cn(
                          "select-none transition-opacity duration-200",
                          isGiftMarketingContext ? "object-cover" : "object-contain"
                        )}
                        priority={i === 0 || i === selectedImage}
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              : <div className='absolute inset-0 flex items-center justify-center text-gray-300'>
                  <Package className='h-20 w-20' />
                </div>
              }

              {images[selectedImage]?.url && (
                <div
                  ref={pdpLensBoxRef}
                  className={cn(
                    "pointer-events-none absolute left-0 top-0 z-[7] overflow-hidden border-2 border-[#c5a059]/40 bg-white shadow-2xl",
                    hoverZoomEnabled ? "block" : "hidden",
                    "will-change-transform [backface-visibility:hidden]",
                    "transition-opacity duration-200 ease-out",
                    pdpLensVisible ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    width: PDP_MAIN_LENS_PX,
                    height: PDP_MAIN_LENS_PX,
                    transform: "translate3d(0,0,0)",
                  }}
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={pdpLensImgRef}
                    src={images[selectedImage].url}
                    alt=''
                    draggable={false}
                    className='absolute max-w-none object-cover [backface-visibility:hidden]'
                    style={{
                      willChange: "transform",
                      transform: "translate3d(0,0,0)",
                    }}
                  />
                </div>
              )}

              {/* Desktop invisible zoom/prev/next overlay targets */}

              {images.length > 1 && hoverZoomEnabled ?
                <div className='absolute inset-0 z-[4] hidden md:flex'>
                  <button
                    type='button'
                    className='h-full w-[32%] cursor-w-resize bg-transparent'
                    aria-label='Previous image'
                    onClick={(e) => handleImageZoneClick(e, "prev")}
                  />
                  <button
                    type='button'
                    className='h-full w-[36%] cursor-zoom-in bg-transparent'
                    aria-label='Open zoom gallery'
                    onClick={(e) => handleImageZoneClick(e, "zoom")}
                  />
                  <button
                    type='button'
                    className='h-full w-[32%] cursor-e-resize bg-transparent'
                    aria-label='Next image'
                    onClick={(e) => handleImageZoneClick(e, "next")}
                  />
                </div>
              : null}

              {images.length === 1 && images[0]?.url && hoverZoomEnabled && (
                <button
                  type='button'
                  className="absolute inset-0 z-[4] bg-transparent cursor-zoom-in hidden md:block"
                  aria-label='Open zoom gallery'
                  onClick={() => setImageLightboxOpen(true)}
                />
              )}

              <div className='pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5'>
                {isFeatured && (
                  <span className='flex items-center gap-1 bg-[#c5a059] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow'>
                    <Star className='h-3 w-3 fill-white' />
                    Editor&apos;s Pick
                  </span>
                )}
                {isOutOfStock && (
                  <span className='bg-navy-900/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white'>
                    Sold Out
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className='pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy-900/70 px-3 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm md:hidden'>
                  {selectedImage + 1} / {images.length}
                </div>
              )}

              <div className='absolute right-3 top-3 z-20 flex flex-col gap-2'>
                <button
                  type='button'
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWishlist();
                  }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all",
                    inWishlist ?
                      "bg-brand-600 text-white"
                    : "bg-white/90 text-gray-600 hover:bg-white hover:text-brand-600",
                  )}
                  aria-label='Wishlist'
                >
                  <Heart
                    className={cn("h-4 w-4", inWishlist && "fill-current")}
                  />
                </button>
                <button
                  type='button'
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md hover:bg-white hover:text-navy-700'
                  aria-label='Share'
                >
                  {copied ?
                    <Check className='h-4 w-4 text-green-500' />
                  : <Share2 className='h-4 w-4' />}
                </button>
              </div>

              {/* Mobile Fullscreen Icon Button */}
              <div className='absolute bottom-3 right-3 z-20 md:hidden'>
                <button
                  type='button'
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setImageLightboxOpen(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageLightboxOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm shadow-md active:bg-black/60 transition-colors"
                  aria-label="View Full Screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <ProductImageLightbox
          images={images.map((img) => ({ url: img.url, alt: img.alt }))}
          productName={name}
          isSquareAspect={isGiftMarketingContext}
          open={imageLightboxOpen}
          initialIndex={selectedImage}
          onClose={() => setImageLightboxOpen(false)}
          onActiveIndexChange={setSelectedImage}
        />
      )}
    </>
  );
}

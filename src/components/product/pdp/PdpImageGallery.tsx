"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Package,
  Heart,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProductImageLightbox from "@/components/product/ProductImageLightbox";
import { PDP_MAIN_LENS_PX, PDP_MAIN_LENS_ZOOM } from "./constants";

export interface PdpImageGalleryProps {
  productId: string;
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

export function PdpImageGallery({
  productId,
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
  const [pdpLensVisible, setPdpLensVisible] = useState(false);

  useEffect(() => {
    setSelectedImage(0);
    setImageLightboxOpen(false);
  }, [productId]);

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

  const onPdpMainImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
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

  const onPdpMainImageMouseLeave = () => {
    if (pdpLensRafRef.current != null) {
      cancelAnimationFrame(pdpLensRafRef.current);
      pdpLensRafRef.current = null;
    }
    setPdpLensVisible(false);
    pdpLensMetricsRef.current = null;
  };

  return (
    <>
      <div className='relative flex gap-3.5 lg:gap-5 min-w-0 overflow-x-hidden overflow-y-visible lg:overflow-visible'>
        {images.length > 1 && (
          <div
            ref={thumbsRef}
            className='hidden lg:flex flex-col gap-2 w-[88px] flex-shrink-0 overflow-y-auto scrollbar-hide relative z-30'
            style={{
              marginLeft:
                "calc(-1 * (max((100vw - 1280px) / 2, 0px) + 2rem) + 12px)",
            }}
          >
            {images.map((img, i) => (
              <button
                key={i}
                type='button'
                onMouseEnter={() => setSelectedImage(i)}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "flex-shrink-0 w-full overflow-hidden rounded-xl border-2 transition-all duration-150 bg-gray-50",
                  i === selectedImage ?
                    "border-brand-600 ring-2 ring-brand-100"
                  : "border-gray-200 hover:border-brand-400",
                )}
                style={{ aspectRatio: isGiftMarketingContext ? "1/1" : "3/4" }}
              >
                <div className='relative w-full h-full'>
                  <Image
                    src={img.url}
                    alt={img.alt || `${name} ${i + 1}`}
                    fill
                    sizes='176px'
                    quality={90}
                    className={
                      isGiftMarketingContext ? "object-cover" : "object-contain"
                    }
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className='flex-1 min-w-0 space-y-3'>
          <div
            ref={pdpMainImageRef}
            className='relative w-full overflow-hidden rounded-2xl bg-gray-50'
            style={{ aspectRatio: isGiftMarketingContext ? "1/1" : "3/4" }}
            onMouseMove={onPdpMainImageMouseMove}
            onMouseLeave={onPdpMainImageMouseLeave}
          >
            {images[selectedImage]?.url ?
              <div className='absolute inset-0 z-0'>
                <Image
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt || name}
                  fill
                  sizes='(max-width: 1024px) 100vw, (max-width: 1536px) 50vw, 720px'
                  quality={92}
                  className={cn(
                    "transition-opacity duration-200",
                    isGiftMarketingContext ? "object-cover" : "object-contain",
                  )}
                  priority
                />
              </div>
            : <div className='absolute inset-0 flex items-center justify-center text-gray-300'>
                <Package className='w-20 h-20' />
              </div>
            }

            {images[selectedImage]?.url && (
              <div
                ref={pdpLensBoxRef}
                className={cn(
                  "pointer-events-none absolute left-0 top-0 z-[7] hidden overflow-hidden rounded-xl border-2 border-white shadow-2xl ring-2 ring-black/15 lg:block",
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

            {images[selectedImage]?.url && (
              <button
                type='button'
                className='absolute inset-0 z-[5] cursor-default bg-transparent transition-colors hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 lg:cursor-zoom-in'
                aria-label='Open zoom gallery'
                onClick={() => setImageLightboxOpen(true)}
              >
                <span className='sr-only'>Open zoom gallery</span>
              </button>
            )}

            <div className='pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5'>
              {isFeatured && (
                <span className='text-xs font-bold bg-white text-gold-500 px-2.5 py-1 rounded-full shadow flex items-center gap-1'>
                  <Star className='w-3 h-3 fill-gold-500 ' />
                  Editor&apos;s Pick
                </span>
              )}
              {isOutOfStock && (
                <span className='text-xs font-semibold bg-gray-800/80 text-white px-2.5 py-1 rounded-full'>
                  Sold Out
                </span>
              )}
            </div>

            <div className='absolute top-3 right-3 z-20 flex flex-col gap-2'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onWishlist();
                }}
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-all",
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
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className='h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-navy-700 flex items-center justify-center shadow-md'
                aria-label='Share'
              >
                {copied ?
                  <Check className='h-4 w-4 text-green-500' />
                : <Share2 className='h-4 w-4' />}
              </button>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(
                      (selectedImage - 1 + images.length) % images.length,
                    );
                  }}
                  className='lg:hidden absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow hover:bg-white'
                >
                  <ChevronLeft className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((selectedImage + 1) % images.length);
                  }}
                  className='lg:hidden absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow hover:bg-white'
                >
                  <ChevronRight className='h-4 w-4' />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className='lg:hidden w-full min-w-0 max-w-full flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide pb-1'
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "flex-shrink-0 w-14 overflow-hidden rounded-lg border-2 transition-all bg-gray-50",
                    i === selectedImage ?
                      "border-brand-600 ring-2 ring-brand-200"
                    : "border-transparent hover:border-brand-400",
                  )}
                  style={{
                    aspectRatio: isGiftMarketingContext ? "1/1" : "3/4",
                  }}
                >
                  <div className='relative w-full h-full'>
                    <Image
                      src={img.url}
                      alt={img.alt || `${name} ${i + 1}`}
                      fill
                      sizes='112px'
                      quality={88}
                      className={
                        isGiftMarketingContext ? "object-cover" : (
                          "object-contain"
                        )
                      }
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Instagram, Star, X } from "lucide-react";
import { storefrontApi, testimonialApi } from "@/lib/api";
import type { Testimonial } from "@/types";
import { cn } from "@/lib/utils";
import { homeSectionStyles } from "@/lib/homeSectionStyles";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";

const FALLBACK_IG = "https://www.instagram.com/housofrani";

type StoryProduct = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};

type StoryCard = {
  id: string;
  quote: string;
  rating: number;
  name: string;
  imageUrl?: string;
  allUrls: string[];
  product?: StoryProduct;
};

type GalleryPhoto = {
  url: string;
  name: string;
  quote: string;
  rating: number;
  storyId: string;
  product?: StoryProduct;
};

/** Canonical PDP path used across the storefront — not /shop/product/... */
function productHref(product?: StoryProduct) {
  if (!product) return null;
  const slug = product.slug?.trim();
  if (slug) return `/shop/${encodeURIComponent(slug)}`;
  if (product._id) return `/shop/${encodeURIComponent(product._id)}`;
  return null;
}

function instagramHandleFromUrl(url: string) {
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean)[0];
    return path ? `@${path}` : "@housofrani";
  } catch {
    return "@housofrani";
  }
}

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <div
      className='flex items-center gap-0.5'
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            dim,
            "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
            i < rating ?
              "fill-[#d4b87a] text-[#d4b87a]"
            : "fill-white/25 text-white/25",
          )}
        />
      ))}
    </div>
  );
}

function ProductChip({ product }: { product: StoryProduct }) {
  const href = productHref(product);
  if (!href) return null;

  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="mt-0.5 inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-left text-white ring-1 ring-white/30 backdrop-blur-[2px] transition hover:bg-black/55"
    >
      {product.image ? (
        <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-white/30 ring-1 ring-white/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        </span>
      ) : null}
      <span className="truncate text-[9px] font-medium tracking-wide sm:text-[10px]">
        Shop · {product.name}
      </span>
    </Link>
  );
}

function StoryTile({ story }: { story: StoryCard }) {
  return (
    <div className='story-inner relative aspect-[9/16] w-full overflow-hidden rounded-[1.15rem] bg-navy-950 shadow-[0_14px_32px_rgba(15,23,42,0.18)] will-change-transform'>
      {story.imageUrl ?
        <Image
          src={story.imageUrl}
          alt=''
          fill
          loader={cloudinaryLoader}
          sizes='(max-width: 640px) 48vw, 220px'
          className='object-cover'
          draggable={false}
        />
      : <div
          className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2a3550_0%,_#0f172a_70%)]'
          aria-hidden
        />
      }

      <div
        className='pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/75 via-black/28 to-transparent'
        aria-hidden
      />

      <div className='absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 px-3 pb-3 pt-8 sm:px-3.5 sm:pb-3.5'>
        <Stars rating={story.rating} />
        <p className='line-clamp-4 font-serif text-[11px] leading-snug text-white italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[12px]'>
          &ldquo;{story.quote}&rdquo;
        </p>
        <p className='text-[8px] font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-[9px]'>
          — {story.name}
        </p>
        {story.product ?
          <ProductChip product={story.product} />
        : null}
      </div>
    </div>
  );
}

function PhotoGallery({
  photos,
  startIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [view, setView] = useState<"grid" | "full">("grid");
  const [index, setIndex] = useState(startIndex);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "full") setView("grid");
        else onClose();
      }
      if (view === "full" && e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + photos.length) % photos.length);
      }
      if (view === "full" && e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length, view]);

  const current = photos[index];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[110] flex flex-col bg-[#0b1220] transition-opacity duration-300",
        entered ? "opacity-100" : "opacity-0",
      )}
      role='dialog'
      aria-modal='true'
      aria-label='Customer photo gallery'
    >
      <div className='flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6'>
        <div>
          <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4b87a]'>
            Customer photos
          </p>
          <p className='mt-0.5 text-sm text-white/80'>
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </p>
        </div>
        <button
          type='button'
          className='rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20'
          aria-label='Close gallery'
          onClick={onClose}
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {view === "grid" ?
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6'>
          <div className='mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5'>
            {photos.map((photo, i) => (
              <button
                key={`${photo.url}-${i}`}
                type='button'
                onClick={() => {
                  setIndex(i);
                  setView("full");
                }}
                className='group relative aspect-[9/16] overflow-hidden rounded-xl bg-navy-950 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Photo from ${photo.name}`}
                  className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]'
                  loading={i < 6 ? "eager" : "lazy"}
                />
                <div
                  className='pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/75 via-black/30 to-transparent'
                  aria-hidden
                />
                <div className='absolute inset-x-0 bottom-0 p-2.5 sm:p-3'>
                  <div className='mb-1'>
                    <Stars rating={photo.rating} />
                  </div>
                  <p className='line-clamp-2 font-serif text-[11px] leading-snug text-white italic sm:text-xs'>
                    &ldquo;{photo.quote}&rdquo;
                  </p>
                  <p className='mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80'>
                    — {photo.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      : current ?
        <div className='relative flex min-h-0 flex-1 flex-col'>
          <div className='relative flex min-h-0 flex-1 items-center justify-center px-3 py-3 sm:px-8'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.url}
              src={current.url}
              alt={`Photo from ${current.name}`}
              className='max-h-full max-w-full rounded-xl object-contain shadow-2xl'
            />

            {photos.length > 1 && (
              <>
                <button
                  type='button'
                  className='absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white hover:bg-black/60 sm:left-4'
                  aria-label='Previous photo'
                  onClick={() =>
                    setIndex((i) => (i - 1 + photos.length) % photos.length)
                  }
                >
                  <ChevronLeft className='h-5 w-5' />
                </button>
                <button
                  type='button'
                  className='absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white hover:bg-black/60 sm:right-4'
                  aria-label='Next photo'
                  onClick={() => setIndex((i) => (i + 1) % photos.length)}
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </>
            )}
          </div>

          <div className='shrink-0 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6'>
            <div className='mx-auto flex max-w-lg flex-col gap-1.5'>
              <Stars rating={current.rating} size='md' />
              <p className='font-serif text-sm leading-relaxed text-white italic sm:text-base'>
                &ldquo;{current.quote}&rdquo;
              </p>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80'>
                  — {current.name}
                </p>
                <p className='text-[11px] text-white/45'>
                  {index + 1} / {photos.length}
                </p>
              </div>
              {current.product ?
                <ProductChip product={current.product} />
              : null}
              <button
                type='button'
                className='mt-2 self-start text-[11px] font-medium uppercase tracking-[0.16em] text-[#d4b87a] hover:text-white'
                onClick={() => setView("grid")}
              >
                ← All photos
              </button>
            </div>
          </div>
        </div>
      : null}
    </div>
  );
}

/** One sequence wide enough that 2 copies always fill the screen */
function buildSequence(stories: StoryCard[], minCards = 10): StoryCard[] {
  if (stories.length === 0) return [];
  const out: StoryCard[] = [];
  let round = 0;
  while (out.length < Math.max(minCards, stories.length)) {
    for (const s of stories) {
      out.push({ ...s, id: `${s.id}__s${round}` });
    }
    round += 1;
  }
  return out;
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<{ startIndex: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState(FALLBACK_IG);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const pointerX = useRef(0);

  useEffect(() => {
    let cancelled = false;
    testimonialApi
      .getPublic()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.testimonials;
        setItems(Array.isArray(list) ? (list as Testimonial[]) : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    storefrontApi
      .getSettings()
      .then((res) => {
        if (cancelled) return;
        const url = res.data?.settings?.footer?.instagramUrl?.trim();
        if (url) setInstagramUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const igHandle = useMemo(
    () => instagramHandleFromUrl(instagramUrl),
    [instagramUrl],
  );

  const stories = useMemo<StoryCard[]>(() => {
    return items
      .filter(
        (t) =>
          t &&
          typeof t.quote === "string" &&
          t.quote.trim().length > 0 &&
          Number(t.rating) >= 3 &&
          Array.isArray(t.images) &&
          t.images.some((img) => img?.url),
      )
      .map((t) => {
        const urls = (t.images || [])
          .map((img) => img?.url)
          .filter(Boolean) as string[];
        return {
          id: t._id,
          quote: t.quote.trim(),
          rating: Number(t.rating) || 5,
          name: t.displayName || "Anonymous",
          imageUrl: urls[0],
          allUrls: urls,
          product: t.product,
        };
      });
  }, [items]);

  const sequence = useMemo(() => buildSequence(stories, 12), [stories]);
  // Two identical halves → animate -50% forever (true continuous, no restart jump)
  const ribbon = useMemo(
    () => [
      ...sequence.map((s) => ({ ...s, id: `${s.id}__a` })),
      ...sequence.map((s) => ({ ...s, id: `${s.id}__b` })),
    ],
    [sequence],
  );

  const galleryPhotos = useMemo<GalleryPhoto[]>(() => {
    const out: GalleryPhoto[] = [];
    for (const s of stories) {
      for (const url of s.allUrls) {
        out.push({
          url,
          name: s.name,
          quote: s.quote,
          rating: s.rating,
          storyId: s.id,
          product: s.product,
        });
      }
    }
    return out;
  }, [stories]);

  // Soft tilt: center of viewport flat; edges gently tilted
  useEffect(() => {
    if (stories.length === 0) return;
    let raf = 0;

    const tick = () => {
      const rail = railRef.current;
      if (rail) {
        const root = rail.getBoundingClientRect();
        if (root.width > 0) {
          const centerX = root.left + root.width / 2;
          const half = root.width * 0.52;
          const maxTilt = 16;
          const cards = rail.querySelectorAll<HTMLElement>(".story-inner");
          cards.forEach((inner) => {
            const rect = inner.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const t = Math.max(-1, Math.min(1, (cx - centerX) / half));
            const abs = Math.abs(t);
            const tilt = t * -maxTilt;
            const scale = 1 - abs * 0.04;
            const lift = abs * abs * 7;
            inner.style.transform = `perspective(1100px) rotateY(${tilt}deg) translateY(${lift}px) scale(${scale})`;
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stories.length, ribbon.length]);

  const openGalleryForStory = useCallback(
    (story: StoryCard) => {
      if (dragRef.current) return;
      if (galleryPhotos.length === 0) return;
      const baseId = story.id
        .replace(/__(s\d+|a|b)+$/g, "")
        .replace(/__s\d+$/, "");
      const cleanId = story.id.split("__")[0];
      const firstUrl = story.imageUrl || story.allUrls[0];
      const idx = Math.max(
        0,
        galleryPhotos.findIndex(
          (p) =>
            p.url === firstUrl || p.storyId === cleanId || p.storyId === baseId,
        ),
      );
      setGallery({ startIndex: idx });
    },
    [galleryPhotos],
  );

  // Duration scales with content so speed feels steady
  const durationSec = Math.max(28, sequence.length * 3.2);

  if (stories.length === 0) return null;

  return (
    <section
      className={cn(
        homeSectionStyles.pageBg,
        "overflow-x-clip py-12 sm:py-16 lg:py-20",
      )}
      aria-label='Customer love and photo stories'
    >
      <div className={cn(homeSectionStyles.container, "mb-7 sm:mb-9")}>
        <HomeSectionHeader
          eyebrow="Stories from our community"
          title="Voices of Grace"
          subtitle="Customer photos & reviews — tap a story, shop the look, follow us for more."
        />
      </div>

      {/* Same width shell as Explore Our House — laptop side gap, mobile full-bleed */}
      <div className='mx-auto max-w-7xl px-0 md:px-6 lg:px-8'>
        <div
          ref={railRef}
          data-lenis-prevent-horizontal
          className='relative overflow-hidden py-6'
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            if (!gallery) setPaused(false);
          }}
        >
          <style jsx global>{`
            @keyframes voices-marquee {
              from {
                transform: translate3d(0, 0, 0);
              }
              to {
                transform: translate3d(-50%, 0, 0);
              }
            }
            .voices-track {
              display: flex;
              width: max-content;
              gap: 0.05rem;
              align-items: center;
              will-change: transform;
              animation-name: voices-marquee;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }
            .voices-track.is-paused {
              animation-play-state: paused;
            }
            .voices-card {
              flex: 0 0 auto;
              width: min(44vw, 168px);
            }
            @media (min-width: 640px) {
              .voices-card {
                width: 180px;
              }
              .voices-track {
                gap: 0.85rem;
              }
            }
            @media (min-width: 1024px) {
              .voices-card {
                width: 196px;
              }
              .voices-track {
                gap: 1rem;
              }
            }
          `}</style>

          <div
            className={cn("voices-track", (paused || gallery) && "is-paused")}
            style={{ animationDuration: `${durationSec}s` }}
            onPointerDown={(e) => {
              setPaused(true);
              dragRef.current = false;
              pointerX.current = e.clientX;
            }}
            onPointerMove={(e) => {
              if (Math.abs(e.clientX - pointerX.current) > 8)
                dragRef.current = true;
            }}
            onPointerUp={() => {
              if (!gallery) setPaused(false);
              window.setTimeout(() => {
                dragRef.current = false;
              }, 40);
            }}
            onPointerCancel={() => {
              if (!gallery) setPaused(false);
            }}
          >
            {ribbon.map((story) => (
              <button
                key={story.id}
                type='button'
                className='voices-card cursor-grab text-left active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] focus-visible:ring-offset-2'
                onClick={() => openGalleryForStory(story)}
                aria-label={`Story from ${story.name}`}
              >
                <StoryTile story={story} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn(homeSectionStyles.container, "mt-2 flex justify-center sm:mt-4")}>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] sm:gap-3.5 sm:px-5 sm:py-3"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(45deg,#f58529,#dd2a7b,#8134af,#515bd4)] text-white shadow-sm sm:h-11 sm:w-11"
            aria-hidden
          >
            <Instagram className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-900/55">
              Follow us
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-navy-950 group-hover:text-navy-800 sm:text-[15px]">
              {igHandle}
            </span>
          </span>
          <span className="ml-1 rounded-full bg-navy-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition group-hover:bg-navy-800 sm:ml-2">
            Follow
          </span>
        </a>
      </div>

      {gallery && galleryPhotos.length > 0 && (
        <PhotoGallery
          photos={galleryPhotos}
          startIndex={gallery.startIndex}
          onClose={() => setGallery(null)}
        />
      )}
    </section>
  );
}

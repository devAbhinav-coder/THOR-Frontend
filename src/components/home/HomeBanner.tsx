"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { storefrontApi } from "@/lib/api";
import { HomeEditorialGalleryTile, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { homeSectionStyles } from "@/lib/homeSectionStyles";
import { useHomeReveal } from "@/hooks/useHomeReveal";
import { HorizontalScrollSurface } from "@/components/ui/HorizontalScrollSurface";

type Props = {
  /** SSR-prefetched storefront settings — avoids a client fetch + late mount CLS. */
  initialSettings?: StorefrontSettings | null;
};

const PERK_SUBTITLES = [
  "Soft textures and rich weaves chosen for comfort and elegance.",
  "Thoughtfully selected shades inspired by timeless Indian traditions.",
  "Crafted to bring together timeless tradition and graceful elegance.",
] as const;

const DEFAULT_PERKS = [
  "Premium fabrics",
  "Curated colors",
  "Authentic Craftsmanship",
] as const;

function isUsableImage(url?: string | null): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function splitPromoTitle(title: string): {
  lead: string;
  accent: string | null;
} {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { lead: title, accent: null };
  return {
    lead: parts.slice(0, -1).join(" "),
    accent: parts[parts.length - 1] ?? null,
  };
}

type ResolvedTile = {
  src: string;
  alt: string;
  href: string;
  slot: number;
};

type GalleryTileProps = {
  src: string;
  alt: string;
  href: string;
  className?: string;
  frameClassName?: string;
  mediaClassName?: string;
  sizes: string;
  priority?: boolean;
  revealDelay?: string;
};

function GalleryTile({
  src,
  alt,
  href,
  className,
  frameClassName,
  mediaClassName,
  sizes,
  priority = false,
  revealDelay = "0ms",
}: GalleryTileProps) {
  return (
    <div
      data-home-reveal
      style={{ "--home-reveal-delay": revealDelay } as CSSProperties}
      className={cn("h-full min-h-0", frameClassName)}
    >
      <Link
        href={href}
        className={cn(
          "group block h-full border border-[#c5a059]/40 bg-white p-2 transition-shadow duration-500 md:hover:shadow-[0_12px_40px_rgba(0,13,33,0.08)] sm:p-2.5 lg:border-[#c5a059]/50",
          className,
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-gray-100",
            mediaClassName ?? "aspect-[4/5]",
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            loader={cloudinaryLoader}
            sizes={sizes}
            className='object-cover object-center transition-transform duration-700 md:group-hover:scale-[1.04]'
            loading={priority ? "eager" : "lazy"}
            quality={priority ? 72 : 68}
            priority={priority}
          />
          <div
            className='pointer-events-none absolute inset-0 bg-gradient-to-t from-[#000d21]/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 md:group-hover:opacity-100'
            aria-hidden
          />
        </div>
      </Link>
    </div>
  );
}

function resolveEditorialTiles(
  tiles: HomeEditorialGalleryTile[] | undefined,
  fallbackHref: string,
): ResolvedTile[] {
  if (!Array.isArray(tiles)) return [];

  return tiles
    .map((tile, slot) => {
      if (!isUsableImage(tile.image)) return null;
      const href = tile.link?.trim() || fallbackHref;
      const alt = tile.alt?.trim() || "Editorial collection highlight";
      return { src: tile.image.trim(), alt, href, slot };
    })
    .filter((tile): tile is ResolvedTile => tile !== null);
}

export default function HomeBanner({ initialSettings }: Props = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  useHomeReveal(sectionRef);

  const [settings, setSettings] = useState<StorefrontSettings | null>(
    () => initialSettings ?? null,
  );
  const [playHeroEntrance, setPlayHeroEntrance] = useState(false);

  useEffect(() => {
    if (initialSettings) return;
    let cancelled = false;
    storefrontApi
      .getSettings()
      .then((res) => {
        if (!cancelled) setSettings(res.data?.settings || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialSettings]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlayHeroEntrance(true);
      return;
    }
    const id = requestAnimationFrame(() => setPlayHeroEntrance(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const promo = settings?.promoBanner;
  const editorial = settings?.homeEditorialGallery;

  const ctaHref = promo?.primaryButtonLink || "/shop?sort=-createdAt";

  const resolvedTiles = useMemo(
    () => resolveEditorialTiles(editorial?.tiles, ctaHref),
    [editorial?.tiles, ctaHref],
  );

  const showGallery = editorial?.isActive !== false && resolvedTiles.length > 0;

  const galleryEyebrow = editorial?.eyebrow?.trim() || "";
  const galleryTitle = editorial?.title?.trim() || "";
  const gallerySubtitle = editorial?.subtitle?.trim() || "";
  const galleryCtaText = editorial?.ctaText?.trim() || "";
  const galleryCtaLink = editorial?.ctaLink?.trim() || ctaHref;

  const showGalleryHeader =
    Boolean(galleryEyebrow) ||
    Boolean(galleryTitle) ||
    Boolean(gallerySubtitle) ||
    Boolean(galleryCtaText);

  const leftTile = resolvedTiles.find((t) => t.slot === 0);
  const rightTiles = resolvedTiles.filter((t) => t.slot === 1 || t.slot === 2);

  if (!promo?.title || !promo?.backgroundImage) return null;

  const { lead: titleLead, accent: titleAccent } = splitPromoTitle(promo.title);
  const ctaText = promo.primaryButtonText || "Explore Now";
  const perks =
    promo.perks?.length ? promo.perks.slice(0, 3) : [...DEFAULT_PERKS];
  const showSecondary =
    Boolean(promo.secondaryButtonText?.trim()) ||
    Boolean(promo.secondaryButtonLink?.trim());

  return (
    <section
      ref={sectionRef}
      className={cn(homeSectionStyles.pageBg, "overflow-hidden")}
      aria-label='Promotional highlights'
    >
      {/* Hero — festive edit */}
      <div className='relative min-h-[420px] w-full overflow-hidden sm:min-h-[460px] lg:min-h-[520px]'>
        <Image
          src={promo.backgroundImage}
          alt=''
          fill
          loader={cloudinaryLoader}
          sizes='100vw'
          className={cn(
            "object-cover",
            playHeroEntrance && "motion-safe:animate-hero-ken-burns",
          )}
          loading='eager'
          quality={78}
          priority
        />
        <div
          className='absolute inset-0 bg-gradient-to-t from-[#000d21]/85 via-[#000d21]/50 to-[#000d21]/20'
          aria-hidden='true'
        />

        <div className='absolute inset-0 flex flex-col items-center justify-center px-6 py-14 text-center sm:px-10'>
          {promo.eyebrow ?
            <span
              className={cn(
                "mb-5 inline-flex items-center border border-[#c5a059]/70 bg-black/25 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[#c5a059] backdrop-blur-sm sm:mb-6 sm:text-[11px]",
                playHeroEntrance && "motion-safe:animate-hero-caption-in",
              )}
              style={{ animationDelay: playHeroEntrance ? "80ms" : undefined }}
            >
              {promo.eyebrow}
            </span>
          : null}

          <h2
            className={cn(
              "max-w-3xl font-serif text-4xl font-medium leading-[1.1] text-white sm:text-5xl lg:text-6xl [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]",
              playHeroEntrance && "motion-safe:animate-hero-caption-in",
            )}
            style={{ animationDelay: playHeroEntrance ? "140ms" : undefined }}
          >
            {titleAccent ?
              <>
                {titleLead}{" "}
                <span className='italic text-[#c5a059]'>{titleAccent}</span>
              </>
            : titleLead}
          </h2>

          {promo.description ?
            <p
              className={cn(
                "mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:mt-5 sm:max-w-lg sm:text-base",
                playHeroEntrance && "motion-safe:animate-hero-caption-in",
              )}
              style={{ animationDelay: playHeroEntrance ? "220ms" : undefined }}
            >
              {promo.description}
            </p>
          : null}

          <div
            className={cn(
              "mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center",
              playHeroEntrance && "motion-safe:animate-hero-caption-in",
            )}
            style={{ animationDelay: playHeroEntrance ? "300ms" : undefined }}
          >
            <Link
              href={ctaHref}
              className='inline-flex items-center justify-center bg-[#c5a059] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#b8924f] sm:px-10 sm:text-xs'
            >
              {ctaText}
            </Link>
            {showSecondary ?
              <Link
                href={promo.secondaryButtonLink || "/shop"}
                className='inline-flex items-center justify-center border border-white/50 bg-white/10 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-10 sm:text-xs'
              >
                {promo.secondaryButtonText || "Browse All"}
              </Link>
            : null}
          </div>
        </div>
      </div>

      {showGallery ?
        <>
          {showGalleryHeader ?
            <div
              className={cn(
                homeSectionStyles.container,
                "pt-10 sm:pt-12 lg:pt-14",
              )}
            >
              <div
                data-home-reveal
                className='mb-6 flex flex-col items-center gap-4 text-center sm:mb-8 lg:flex-row lg:items-end lg:justify-between lg:text-left'
              >
                <div>
                  {galleryEyebrow ?
                    <p className='text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs'>
                      {galleryEyebrow}
                    </p>
                  : null}
                  {galleryTitle ?
                    <h3
                      className={cn(
                        "font-serif text-2xl font-medium leading-tight text-navy-900 sm:text-3xl lg:text-[2rem]",
                        galleryEyebrow && "mt-3",
                      )}
                    >
                      {galleryTitle}
                    </h3>
                  : null}
                  {gallerySubtitle ?
                    <p className='mt-2 max-w-xl text-sm leading-relaxed text-gray-500 lg:max-w-md'>
                      {gallerySubtitle}
                    </p>
                  : null}
                </div>
                {galleryCtaText ?
                  <Link
                    href={galleryCtaLink}
                    className='shrink-0 text-[11px] font-medium uppercase tracking-[0.22em] text-navy-900 underline decoration-[#c5a059]/80 underline-offset-[6px] transition-colors hover:text-[#c5a059] sm:text-xs'
                  >
                    {galleryCtaText}
                  </Link>
                : null}
              </div>
            </div>
          : <div className='pt-10 sm:pt-12 lg:pt-14' />}

          {/* Mobile — horizontal scroll */}
          <div className='md:hidden'>
            <HorizontalScrollSurface className='flex snap-x snap-mandatory gap-3 px-4 pb-1 scrollbar-hide'>
              {resolvedTiles.map((tile, index) => (
                <GalleryTile
                  key={`mobile-${tile.slot}`}
                  src={tile.src}
                  alt={tile.alt}
                  href={tile.href}
                  className='w-[80vw] shrink-0 snap-center sm:w-[260px]'
                  mediaClassName='aspect-[4/5]'
                  sizes='(max-width: 640px) 80vw, 260px'
                  priority={index === 0}
                  revealDelay={`${index * 90}ms`}
                />
              ))}
            </HorizontalScrollSurface>
          </div>

          {/* Desktop — compact editorial grid */}
          <div
            className={cn(
              homeSectionStyles.container,
              "hidden gap-2.5 pb-2 md:grid lg:gap-3",
              leftTile && rightTiles.length >= 2 ?
                "md:grid-cols-2 md:grid-rows-2 md:h-[680px] lg:h-[740px]"
              : leftTile && rightTiles.length === 1 ?
                "md:grid-cols-2 md:h-[680px] lg:h-[740px]"
              : resolvedTiles.length >= 3 ?
                "md:grid-cols-3 md:h-[680px] lg:h-[740px]"
              : resolvedTiles.length === 2 ?
                "md:grid-cols-2 md:h-[680px] lg:h-[740px]"
              : "md:grid-cols-1 md:mx-auto md:max-w-xs md:h-[360px]",
            )}
          >
            {leftTile ?
              <GalleryTile
                src={leftTile.src}
                alt={leftTile.alt}
                href={leftTile.href}
                frameClassName={
                  rightTiles.length >= 2 ?
                    "md:row-span-2 md:h-full"
                  : "md:h-full"
                }
                mediaClassName='h-full min-h-0'
                sizes='(max-width: 1024px) 50vw, 640px'
                priority
                revealDelay='0ms'
              />
            : null}

            {rightTiles.map((tile, index) => (
              <GalleryTile
                key={`desktop-${tile.slot}`}
                src={tile.src}
                alt={tile.alt}
                href={tile.href}
                frameClassName='md:h-full'
                mediaClassName='h-full min-h-0 md:aspect-auto aspect-[4/5]'
                sizes='(max-width: 1024px) 25vw, 320px'
                revealDelay={`${(index + (leftTile ? 1 : 0)) * 100}ms`}
              />
            ))}
          </div>
        </>
      : null}

      {/* Perks */}
      <div
        className={cn(homeSectionStyles.container, "py-10 sm:py-12 lg:py-14")}
      >
        <div data-home-reveal className='mb-8 text-center sm:mb-10'>
          <p className='text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs'>
            The House Difference
          </p>
          <h3 className='mt-3 font-serif text-2xl font-medium text-navy-900 sm:text-3xl'>
            Crafted With Intention
          </h3>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5'>
          {perks.map((perk, index) => (
            <div
              key={`${perk}-${index}`}
              data-home-reveal
              style={
                { "--home-reveal-delay": `${index * 100}ms` } as CSSProperties
              }
              className='group relative border border-[#c5a059]/35 bg-white px-6 py-6 transition-shadow duration-500 hover:shadow-[0_10px_36px_rgba(0,13,33,0.06)] sm:px-7 sm:py-7'
            >
              <span
                className='mb-4 block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c5a059]/90'
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className='font-serif text-lg font-medium text-navy-900 sm:text-xl'>
                {perk}
              </p>
              <p className='mt-2 text-sm leading-relaxed text-gray-500'>
                {PERK_SUBTITLES[index] ??
                  PERK_SUBTITLES[PERK_SUBTITLES.length - 1]}
              </p>
              <div
                className='absolute bottom-0 left-6 right-6 h-px origin-left scale-x-0 bg-[#c5a059]/50 transition-transform duration-500 group-hover:scale-x-100 sm:left-7 sm:right-7'
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

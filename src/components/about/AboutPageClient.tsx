"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Gift,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import AboutChapterFeatures from "@/components/about/AboutChapterFeatures";
import AboutExploreHub from "@/components/about/AboutExploreHub";
import AboutConnectSection from "@/components/about/AboutConnectSection";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { BRAND_NAME } from "@/lib/brandSeo";
import { cn } from "@/lib/utils";
import { useAboutReveal } from "@/hooks/useAboutReveal";
import type {
  AboutInternalLink,
  AboutPageVisuals,
  AboutProductTeaser,
  AboutVisualImage,
} from "@/components/about/aboutPageTypes";

const MARQUEE_WORDS = [
  "Kalamkari",
  "Heritage",
  "Story",
  "Drape",
  "Temple Art",
  "Folk Motifs",
  "Rani",
  "Ethnic",
  "Weave",
  "India",
];

type Props = {
  visuals: AboutPageVisuals;
  products: AboutProductTeaser[];
  internalLinks: AboutInternalLink[];
};

function productHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined;
  const h = href.trim();
  return h.startsWith("/") ? h : undefined;
}

function AboutVisualFrame({
  img,
  className,
  priority,
  sizes,
  showViewLabel = false,
}: {
  img: AboutVisualImage | null | undefined;
  className?: string;
  priority?: boolean;
  sizes: string;
  showViewLabel?: boolean;
}) {
  const src = typeof img?.src === "string" ? img.src.trim() : "";
  if (!src) return null;

  const href = productHref(img?.href);
  const alt = img?.alt || `${BRAND_NAME} — handcrafted sarees`;

  const inner = (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loader={cloudinaryLoader}
      />
      {img?.caption ? (
        <figcaption className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-white/90 line-clamp-2">
          {img.caption}
        </figcaption>
      ) : null}
      {showViewLabel && href ? (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-white/95 text-navy-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          View saree
        </span>
      ) : null}
    </>
  );

  const figureClass = cn("relative overflow-hidden block", className);

  if (href) {
    return (
      <Link href={href} className={cn(figureClass, "group")}>
        {inner}
      </Link>
    );
  }

  return <figure className={figureClass}>{inner}</figure>;
}

export default function AboutPageClient({
  visuals,
  products,
  internalLinks,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useAboutReveal(rootRef);
  const heroImage = visuals.hero;
  const { dreamBanner, bento, intention, connect } = visuals;
  const shopLinks = internalLinks.filter((l) => l.group === "shop");
  const helpLinks = internalLinks.filter((l) => l.group === "help");
  const discoverLinks = internalLinks.filter((l) => l.group === "discover");

  return (
    <div ref={rootRef} className="about-page bg-navy-950 text-white overflow-x-hidden">
      {/* ── Cinematic hero ── */}
      <header className="relative min-h-[100svh] flex flex-col justify-end">
        {heroImage ? (
          <div className="absolute inset-0 z-0" aria-hidden>
            <Image
              src={heroImage.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover scale-105"
              loader={cloudinaryLoader}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0 bg-gradient-to-br from-navy-900 via-navy-950 to-brand-950"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-950/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,rgba(196,18,48,0.35),transparent_50%)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
          <nav
            className="flex items-center gap-1.5 text-xs text-white/60 mb-16 sm:mb-24"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-brand-300 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-white font-medium">About</span>
          </nav>

          <div data-about-reveal className="max-w-5xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-brand-200 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" aria-hidden />
              Our story · Since day one
            </p>
            <h1 className="font-serif font-bold leading-[0.92] tracking-tight">
              <span className="block text-[clamp(1.25rem,4vw,2rem)] text-brand-200/90 mb-2 tracking-wide">
                About {BRAND_NAME} — Premium Sarees India
              </span>
              <span className="block text-[clamp(2.75rem,11vw,7rem)] text-white">
                Where Stories
              </span>
              <span className="block text-[clamp(2.75rem,11vw,7rem)] bg-gradient-to-r from-brand-200 via-white to-brand-100 bg-clip-text text-transparent">
                Are Woven
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-2xl font-serif italic text-white/90 max-w-2xl">
              Welcome to {BRAND_NAME}!
            </p>
            <p className="mt-6 text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl">
              There is something quietly powerful about a saree that tells a
              story. Not just through its colour or its drape, but through every
              line etched into its fabric, every motif that carries centuries of
              meaning. At {BRAND_NAME}, that belief is not just a philosophy. It
              is the very thread the brand was built on.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-[0_0_40px_-8px_rgba(196,18,48,0.8)] hover:bg-brand-500 transition-all"
              >
                Shop the collection
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 backdrop-blur px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Read the journal
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 bg-navy-950/80 backdrop-blur-sm overflow-hidden py-3">
          <div className="about-marquee flex whitespace-nowrap">
            {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="mx-6 text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-white/35"
              >
                {word}
                <span className="mx-6 text-brand-500">◆</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* ── Dream — split editorial ── */}
        <section
          className="relative py-20 sm:py-32"
          aria-labelledby="about-dream-heading"
        >
          <div className="absolute inset-0 bg-[#faf9f7] text-navy-900 rounded-t-[2.5rem] sm:rounded-t-[3.5rem]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-6 items-start">
              <div data-about-reveal className="lg:col-span-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600 mb-4">
                  Chapter 01
                </p>
                <h2
                  id="about-dream-heading"
                  className="font-serif text-3xl sm:text-5xl font-bold text-navy-900 leading-[1.05]"
                >
                  A Dream Stitched into Every Saree
                </h2>
              </div>
              <div
                data-about-reveal
                className="lg:col-span-7 space-y-5 text-stone-600 text-[15px] sm:text-lg leading-relaxed"
              >
                <p>
                  {BRAND_NAME} was born from a simple yet deeply personal vision:
                  to create ethnic wear that a modern woman actually wants to live
                  in. Comfortable enough for a long day. Beautiful enough to stop
                  a room. And meaningful enough to be passed down.
                </p>
                <p>
                  For too long, traditional sarees existed at two extremes —
                  heavily ornate pieces reserved for weddings, or plain everyday
                  drapes with little artistry. {BRAND_NAME} steps into the space
                  between, offering modern ethnic sarees that feel as effortless
                  as they look extraordinary.
                </p>
                <blockquote className="relative py-6 pl-6 border-l-4 border-brand-500 font-serif text-2xl sm:text-3xl text-navy-900 leading-snug">
                  That dream? It has finally, beautifully come true.
                </blockquote>
                <p>
                  Each saree from {BRAND_NAME} carries a story drawn from Indian
                  epics, botanical motifs, temple art, and folk traditions. The
                  result is a wearable piece of heritage that feels anything but
                  dated.
                </p>
              </div>
            </div>

            {dreamBanner ? (
              <div
                data-about-reveal-scale
                className="mt-16 sm:mt-20 group relative aspect-[21/9] sm:aspect-[2.4/1] rounded-3xl overflow-hidden ring-1 ring-stone-200/80 shadow-2xl"
              >
                <AboutVisualFrame
                  img={dreamBanner}
                  className="absolute inset-0"
                  sizes="100vw"
                />
              </div>
            ) : null}
          </div>
        </section>

        <AboutChapterFeatures />

        {/* ── Bento gallery ── */}
        {bento.length >= 3 ? (
          <section
            className="bg-navy-950 py-16 sm:py-24"
            aria-label="Saree craftsmanship gallery"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-about-reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold max-w-lg">
                  Woven in detail
                </h2>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-300 hover:text-brand-200 shrink-0"
                >
                  View full collection <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 auto-rows-[minmax(140px,1fr)]">
                {bento.map((img, idx) => (
                  <div
                    key={`${img.src}-${idx}`}
                    data-about-reveal-scale
                    className={cn(
                      "relative overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-white/10",
                      idx === 0 && "col-span-2 md:col-span-7 md:row-span-2 min-h-[280px] md:min-h-[420px]",
                      idx === 1 && "col-span-1 md:col-span-5 min-h-[180px]",
                      idx === 2 && "col-span-1 md:col-span-5 min-h-[180px]",
                      idx === 3 && "col-span-1 md:col-span-4 min-h-[160px]",
                      idx === 4 && "col-span-1 md:col-span-8 min-h-[160px]",
                    )}
                  >
                    <AboutVisualFrame
                      img={img}
                      className="absolute inset-0"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      showViewLabel={Boolean(img.href)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Intention ── */}
        <section
          className="relative py-20 sm:py-32 overflow-hidden"
          aria-labelledby="about-intention-heading"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/40 via-navy-950 to-navy-950" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
            {intention ? (
              <div
                data-about-reveal-scale
                className="group relative aspect-[3/4] max-w-md mx-auto lg:mx-0 rounded-[2rem] overflow-hidden ring-1 ring-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]"
              >
                <AboutVisualFrame
                  img={intention}
                  className="absolute inset-0"
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  showViewLabel={Boolean(intention.href)}
                />
              </div>
            ) : null}
            <div data-about-reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-300 mb-4">
                Chapter 03
              </p>
              <h2
                id="about-intention-heading"
                className="font-serif text-3xl sm:text-5xl font-bold leading-tight"
              >
                Sarees That Say Something
              </h2>
              <p className="mt-6 text-white/75 text-base sm:text-lg leading-relaxed">
                What sets {BRAND_NAME} apart is intention. Every saree in the
                collection is curated around a narrative, a theme, a tale, an
                emotion. When you wear one, you are not just dressed. You are
                draped in a story.
              </p>
              <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed">
                Whether you are attending a festive gathering, a work event, or
                simply embracing your roots on an ordinary Tuesday, there is a{" "}
                {BRAND_NAME} saree made for that moment.
              </p>
            </div>
          </div>
        </section>

        {/* ── Featured products — internal links to PDPs ── */}
        {products.length > 0 ? (
          <section
            className="bg-[#faf9f7] text-navy-900 py-16 sm:py-24"
            aria-labelledby="about-products-heading"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div data-about-reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600">
                    Curated for you
                  </p>
                  <h2
                    id="about-products-heading"
                    className="mt-2 font-serif text-3xl sm:text-4xl font-bold"
                  >
                    Stories you can wear now
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="text-sm font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  All sarees <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p) => (
                  <li key={p.slug} data-about-reveal>
                    <Link
                      href={p.href}
                      className="group block rounded-2xl overflow-hidden bg-white ring-1 ring-stone-100 hover:ring-brand-200 transition-all hover:shadow-xl"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={p.image}
                          alt={`${p.name} — shop at ${BRAND_NAME}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          loader={cloudinaryLoader}
                        />
                      </div>
                      <div className="p-4">
                        <p className="font-serif font-bold text-navy-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                          {p.name}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-600">
                          View saree <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* ── Wear your story ── */}
        <section
          className="relative py-24 sm:py-36 text-center overflow-hidden bg-navy-950"
          aria-labelledby="about-wear-heading"
        >
          <div
            className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"
            aria-hidden
          />
          <div data-about-reveal className="relative max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-300 mb-4">
              Chapter 04
            </p>
            <h2
              id="about-wear-heading"
              className="font-serif text-[clamp(2.5rem,8vw,5rem)] font-bold leading-[1] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
            >
              Wear Your Story
            </h2>
            <p className="mt-8 text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl mx-auto">
              {BRAND_NAME} is for the woman who honours where she comes from and
              knows exactly where she is going. It is for those who refuse to
              choose between comfort and culture, between the traditional and the
              contemporary.
            </p>
            <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              Because the finest sarees have always done both.
            </p>
            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Explore the collection at {BRAND_NAME} and find the story that is
              yours to wear.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-white text-navy-900 px-10 py-4 text-sm font-bold hover:bg-brand-50 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Explore the collection
              </Link>
              <Link
                href="/gifting"
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-white/30 px-10 py-4 text-sm font-bold hover:bg-white/10 transition-colors"
              >
                <Gift className="h-4 w-4" aria-hidden />
                Shop gifting
              </Link>
            </div>
          </div>
        </section>

        <AboutExploreHub
          shopLinks={shopLinks}
          discoverLinks={discoverLinks}
          helpLinks={helpLinks}
        />

        <AboutConnectSection galleryImage={connect ?? undefined} />
      </main>
    </div>
  );
}

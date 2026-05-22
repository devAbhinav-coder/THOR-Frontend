"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Feather, Leaf, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Palette,
    title: "Hand-crafted Kalamkari",
    short: "Kalamkari",
    description:
      "Hand-crafted Kalamkari motifs rooted in authentic regional traditions.",
    tag: "Heritage",
  },
  {
    icon: Feather,
    title: "All-day comfort",
    short: "Comfort",
    description:
      "Breathable, skin-friendly fabrics chosen for all-day comfort.",
    tag: "Wearability",
  },
  {
    icon: Sparkles,
    title: "Contemporary silhouettes",
    short: "Modern drape",
    description:
      "Contemporary silhouettes and colour palettes that pair effortlessly with modern styling.",
    tag: "Modern",
  },
  {
    icon: Leaf,
    title: "Story-led designs",
    short: "Meaning",
    description:
      "Story-led designs — every pattern has a meaning worth knowing.",
    tag: "Intention",
  },
] as const;

export default function AboutChapterFeatures() {
  const [active, setActive] = useState(0);
  const current = FEATURES[active];
  const ActiveIcon = current.icon;

  return (
    <section
      className="relative text-navy-900 py-20 sm:py-28 overflow-hidden"
      aria-labelledby="about-features-heading"
    >
      <div className="absolute inset-0 bg-[#faf9f7]" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,720px)] h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial header */}
        <div
          data-about-reveal
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-12 sm:pb-14 border-b border-stone-200/90"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-brand-600">
              Chapter 02
            </p>
            <h2
              id="about-features-heading"
              className="mt-4 font-serif text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.02] text-navy-900"
            >
              Our sarees
              <span className="block text-stone-400 font-normal italic text-[0.92em]">
                feature:
              </span>
            </h2>
          </div>
          <p className="text-stone-500 text-sm sm:text-base max-w-md leading-relaxed lg:text-right">
            Four pillars of every drape — craft, comfort, modernity, and stories
            woven into the weave.
          </p>
        </div>

        {/* Desktop — four pillars, one row */}
        <div
          data-about-reveal
          className="hidden lg:grid lg:grid-cols-4 mt-0"
          role="list"
        >
          {FEATURES.map((item, i) => {
            const Icon = item.icon;
            const isActive = active === i;
            return (
              <button
                key={item.title}
                type="button"
                role="listitem"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={cn(
                  "group relative text-left px-6 xl:px-8 py-10 transition-colors duration-500",
                  "border-r border-stone-200/80 last:border-r-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                  isActive ? "bg-white" : "bg-transparent hover:bg-white/60",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 left-6 xl:left-8 right-6 xl:right-8 h-0.5 origin-left transition-transform duration-500",
                    isActive
                      ? "scale-x-100 bg-brand-600"
                      : "scale-x-0 bg-brand-600 group-hover:scale-x-100",
                  )}
                  aria-hidden
                />
                <span
                  className="font-serif text-[4.5rem] xl:text-[5.5rem] font-bold leading-none text-stone-200/90 tabular-nums block"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-[#faf9f7] text-navy-900 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50">
                  <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-600">
                  {item.tag}
                </p>
                <h3 className="mt-2 font-serif text-xl xl:text-2xl font-bold text-navy-900 leading-snug">
                  {item.short}
                </h3>
                <p
                  className={cn(
                    "mt-3 text-sm text-stone-500 leading-relaxed transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  )}
                >
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Mobile + tablet — pillar selector + spotlight panel */}
        <div className="lg:hidden mt-8" data-about-reveal>
          <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
            role="tablist"
            aria-label="Saree features"
          >
            {FEATURES.map((item, i) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-controls="about-pillar-panel"
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                  active === i
                    ? "bg-navy-900 text-white shadow-md"
                    : "bg-white text-stone-500 ring-1 ring-stone-200",
                )}
              >
                {item.tag}
              </button>
            ))}
          </div>

          <div
            id="about-pillar-panel"
            role="tabpanel"
            className="mt-5 relative overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-stone-200/90 p-8 sm:p-10"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-transparent"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4">
              <span
                className="font-serif text-6xl font-bold text-stone-100 leading-none tabular-nums"
                aria-hidden
              >
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
                <ActiveIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-600">
              {current.tag}
            </p>
            <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-navy-900">
              {current.title}
            </h3>
            <p className="mt-4 text-stone-600 text-[15px] leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Thread line + CTA */}
        <div
          data-about-reveal
          className="mt-12 sm:mt-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          <div className="flex items-center gap-3 text-stone-400">
            <span className="h-px w-12 sm:w-20 bg-stone-300" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
              04 pillars · one weave
            </span>
            <span className="h-px flex-1 sm:w-20 bg-stone-300" aria-hidden />
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 text-white px-8 py-3.5 text-sm font-bold hover:bg-navy-800 transition-colors group self-center sm:self-auto"
          >
            Explore the collection
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

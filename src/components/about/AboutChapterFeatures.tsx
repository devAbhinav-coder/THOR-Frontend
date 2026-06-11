"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Feather, Leaf, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { aboutPageStyles } from "@/lib/aboutPageStyles";

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

function PillarCard({
  item,
  index,
  isActive,
  onHover,
  className,
}: {
  item: (typeof FEATURES)[number];
  index: number;
  isActive?: boolean;
  onHover?: () => void;
  className?: string;
}) {
  const Icon = item.icon;
  return (
    <article
      onMouseEnter={onHover}
      className={cn(
        "relative flex flex-col p-5 sm:p-6",
        "bg-white border border-gray-200/70",
        "transition-shadow duration-300",
        isActive && "border-[#c5a059]/50 shadow-[0_10px_36px_rgba(0,13,33,0.06)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center bg-navy-900 text-white">
          <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </span>
        <span
          className="font-serif text-2xl sm:text-3xl font-bold text-stone-200 tabular-nums"
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">
        {item.tag}
      </p>
      <h3 className="mt-1.5 font-serif text-lg font-bold text-navy-900 leading-snug">
        {item.title}
      </h3>
      <p className="mt-2 text-sm text-stone-600 leading-relaxed flex-1">
        {item.description}
      </p>
    </article>
  );
}

export default function AboutChapterFeatures() {
  const [active, setActive] = useState(0);

  return (
    <section
      className="relative text-navy-900 py-16 sm:py-24 lg:py-28 overflow-hidden"
      aria-labelledby="about-features-heading"
    >
      <div className="absolute inset-0 bg-[#faf9f7]" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,720px)] h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-about-reveal
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-10 sm:pb-12 border-b border-stone-200/90"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-brand-600">
              Chapter 02
            </p>
            <h2
              id="about-features-heading"
              className="mt-3 font-serif text-[clamp(1.85rem,4.5vw,3.75rem)] font-bold leading-tight text-navy-900"
            >
              Our sarees
              <span className="block text-stone-400 font-normal italic text-[0.92em]">
                feature:
              </span>
            </h2>
          </div>
          <p className="text-stone-500 text-sm sm:text-base max-w-md leading-relaxed">
            Four pillars of every drape — craft, comfort, modernity, and stories
            woven into the weave.
          </p>
        </div>

        {/* Mobile + tablet — all 4 pillars visible (2×2) */}
        <ul
          data-about-reveal
          className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 mt-8 lg:hidden"
          role="list"
        >
          {FEATURES.map((item, i) => (
            <li key={item.title} role="listitem">
              <PillarCard item={item} index={i} />
            </li>
          ))}
        </ul>

        {/* Desktop — interactive row */}
        <div
          data-about-reveal
          className="hidden lg:grid lg:grid-cols-4 mt-10"
          role="list"
        >
          {FEATURES.map((item, i) => (
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
                active === i ? "bg-white" : "bg-transparent hover:bg-white/60",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 left-6 xl:left-8 right-6 xl:right-8 h-0.5 origin-left transition-transform duration-500",
                  active === i ?
                    "scale-x-100 bg-brand-600"
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
              <span className="mt-6 inline-flex h-10 w-10 items-center justify-center border border-gray-200/70 bg-[#faf9f7] text-navy-900">
                <item.icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-600">
                {item.tag}
              </p>
              <h3 className="mt-2 font-serif text-xl xl:text-2xl font-bold text-navy-900 leading-snug">
                {item.short}
              </h3>
              <p
                className={cn(
                  "mt-3 text-sm text-stone-500 leading-relaxed",
                  active === i ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                )}
              >
                {item.description}
              </p>
            </button>
          ))}
        </div>

        <div
          data-about-reveal
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          <div className="flex items-center gap-3 text-stone-400 w-full sm:w-auto">
            <span className="h-px w-10 sm:w-16 bg-stone-300 shrink-0" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-center sm:text-left">
              04 pillars · one weave
            </span>
            <span className="h-px flex-1 sm:w-16 bg-stone-300" aria-hidden />
          </div>
          <Link href="/shop" className={cn(aboutPageStyles.ctaNavy, "w-full sm:w-auto")}>
            Explore the collection
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

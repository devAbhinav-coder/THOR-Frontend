"use client";

import Image from "next/image";
import Link from "next/link";
const PREMIUM_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuofU8c6wRF8VBfwG8U28qE8w2Al1uu9dLi_aXxNV76wGx8yD26CWuEPa3irYKEnIkyBF3RahoLHNInbp-QxhVEoJfFNEvzGZtsupkdksMwpwEKy0uXFVV1USwS2buZLH7UHbo8RhMZmqi_l2oAUP2K3lHVUq-uaVjhA7-OhsXFysQkX402LAxuKKUyLNsfvQjTR1LN8kfabWi35TEiReKKjtCTama74kl4epz8Vl8n-ak7zuas27Y";
import { homeSectionStyles } from "@/lib/homeSectionStyles";
import { cn } from "@/lib/utils";

export default function HomePremiumShowcase() {
  return (
    <section
      className={cn(homeSectionStyles.pageBg, "py-10 sm:py-16 lg:py-20")}
      aria-labelledby="home-premium-heading"
    >
      <div className={homeSectionStyles.container}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
            <Image
              src={PREMIUM_HERO}
              alt="The Rani Premium Edit — handwoven silk sarees"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="text-center lg:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
              The Rani Edit
            </p>
            <h2
              id="home-premium-heading"
              className="mt-3 font-serif text-3xl font-medium leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]"
            >
              The <span className="italic">Premium</span> Collection
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base lg:mx-0">
              Exceptional handwoven sarees — rare silks, masterful zari, and
              over 200 hours of loom work in every piece. Curated for the
              discerning few.
            </p>
            <Link
              href="/premium"
              className="mt-8 inline-flex w-full items-center justify-center bg-navy-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy-800 sm:text-xs lg:w-auto"
            >
              Explore Premium
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

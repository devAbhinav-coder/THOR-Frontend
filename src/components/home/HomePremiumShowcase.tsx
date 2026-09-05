"use client";

import Image from "next/image";
import Link from "next/link";
import { homeSectionStyles } from "@/lib/homeSectionStyles";
import { cn } from "@/lib/utils";
import type { StorefrontSettings } from "@/types";

const DEFAULTS = {
  preHeading: "The Rani Edit",
  heading: "The Premium Collection",
  text: "Exceptional handwoven sarees — rare silks, masterful zari, and over 200 hours of loom work in every piece. Curated for the discerning few.",
  linkText: "Explore Premium",
  linkUrl: "/premium",
} as const;

type Showcase = NonNullable<StorefrontSettings["homePremiumShowcase"]>;

function renderHeading(heading: string) {
  const parts = heading.split(/(Premium)/i);
  if (parts.length === 1) return heading;
  return parts.map((part, i) =>
    /^premium$/i.test(part) ?
      <span key={i} className="italic">
        {part}
      </span>
    : <span key={i}>{part}</span>,
  );
}

type Props = {
  showcase?: Showcase | null;
};

export default function HomePremiumShowcase({ showcase }: Props) {
  if (showcase?.isActive === false) return null;

  const image = showcase?.image?.trim() || "";
  const preHeading = showcase?.preHeading?.trim() || DEFAULTS.preHeading;
  const heading = showcase?.heading?.trim() || DEFAULTS.heading;
  const text = showcase?.text?.trim() || DEFAULTS.text;
  const linkText = showcase?.linkText?.trim() || DEFAULTS.linkText;
  const linkUrl = showcase?.linkUrl?.trim() || DEFAULTS.linkUrl;

  return (
    <section
      className={cn(homeSectionStyles.pageBg, "py-10 sm:py-16 lg:py-20")}
      aria-labelledby="home-premium-heading"
    >
      <div className={homeSectionStyles.container}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
            {image ?
              <Image
                src={image}
                alt={`${heading} — The House of Rani`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            : <div className="absolute inset-0 bg-gradient-to-br from-navy-900/10 via-stone-100 to-[#c5a059]/15" />
            }
          </div>

          <div className="text-center lg:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
              {preHeading}
            </p>
            <h2
              id="home-premium-heading"
              className="mt-3 font-serif text-3xl font-medium leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]"
            >
              {renderHeading(heading)}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base lg:mx-0">
              {text}
            </p>
            <Link
              href={linkUrl}
              className="mt-8 inline-flex w-full items-center justify-center bg-navy-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy-800 sm:text-xs lg:w-auto"
            >
              {linkText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

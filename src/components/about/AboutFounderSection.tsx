"use client";

import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { BRAND_NAME } from "@/lib/brandSeo";
import { aboutPageStyles } from "@/lib/aboutPageStyles";
import {
  FOUNDER_NAME,
  FOUNDER_PARAGRAPHS,
  FOUNDER_PORTRAIT_URL,
} from "@/lib/aboutFounder";

export default function AboutFounderSection() {
  return (
    <section
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden bg-navy-950 text-white"
      aria-labelledby="about-founder-heading"
    >
      <div
        className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_20%_0%,rgba(197,160,89,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-0 w-[min(60vw,480px)] h-[min(50vw,360px)] opacity-20 bg-[radial-gradient(circle_at_100%_100%,rgba(197,160,89,0.35),transparent_60%)]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
          <div data-about-reveal-scale className="lg:col-span-5 order-1">
            <figure className={aboutPageStyles.frameDark}>
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-navy-900">
                <Image
                  src={FOUNDER_PORTRAIT_URL}
                  alt={`${FOUNDER_NAME}, Founder of ${BRAND_NAME}`}
                  fill
                  sizes="(max-width: 1024px) 92vw, 40vw"
                  className="object-cover object-[center_12%]"
                  loader={cloudinaryLoader}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950/70 to-transparent pointer-events-none"
                  aria-hidden
                />
              </div>
              <figcaption className="mt-3 sm:mt-3.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-0.5">
                <span className="font-serif text-lg sm:text-xl text-white">
                  {FOUNDER_NAME}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-brand-300">
                  Founder · Est. vision
                </span>
              </figcaption>
            </figure>
          </div>

          <div data-about-reveal className="lg:col-span-7 order-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-300 mb-4">
              Meet the founder
            </p>
            <h2
              id="about-founder-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.08] text-white"
            >
              {FOUNDER_NAME}
              <span className="block mt-1 text-[0.72em] font-normal italic text-brand-200/90">
                Founder of {BRAND_NAME}
              </span>
            </h2>

            <blockquote className="mt-8 sm:mt-10 relative py-5 pl-5 sm:pl-6 border-l-4 border-brand-500">
              <p className="font-serif text-xl sm:text-2xl text-white/95 leading-snug">
                A bridge between heritage and modernity — reviving India&apos;s
                crafts with a contemporary sensibility.
              </p>
            </blockquote>

            <div className="mt-8 space-y-5 text-white/72 text-[15px] sm:text-base leading-relaxed max-w-2xl">
              {FOUNDER_PARAGRAPHS.map((para) => (
                <p key={para.slice(0, 48)}>{para}</p>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-xl border-t border-white/10 pt-8">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  Born
                </dt>
                <dd className="mt-1.5 font-serif text-xl text-white">1999</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  Trained at
                </dt>
                <dd className="mt-1.5 font-serif text-xl text-white">NIIFT</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  Discipline
                </dt>
                <dd className="mt-1.5 font-serif text-xl text-white">
                  Textile design
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

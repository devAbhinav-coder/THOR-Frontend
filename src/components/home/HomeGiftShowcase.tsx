"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { storefrontApi } from "@/lib/api";
import type { HomeGiftShowcaseCard, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import { resolveHomeGiftShopButton } from "@/lib/homeGiftShopLink";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

type Props = {
  initialSettings?: StorefrontSettings | null;
};

const ROTATE_MS = 4500;

function splitTitle(title: string): { lead: string; accent: string | null } {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { lead: title, accent: null };
  return {
    lead: parts.slice(0, -1).join(" "),
    accent: parts[parts.length - 1] ?? null,
  };
}

function ActiveGiftCta({ card }: { card: HomeGiftShowcaseCard }) {
  const shop = resolveHomeGiftShopButton(card);

  if (!shop) {
    return (
      <Link
        href="/gifting"
        className="inline-flex w-full items-center justify-center bg-navy-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy-800 sm:text-xs lg:w-auto"
      >
        Explore Gift Sets
      </Link>
    );
  }

  if (shop.kind === "coming_soon") {
    return (
      <span className="inline-flex w-full items-center justify-center border border-gray-200 bg-gray-50 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-600 sm:text-xs lg:w-auto">
        {shop.label}
      </span>
    );
  }

  const external = /^https?:\/\//i.test(shop.href);
  const className =
    "inline-flex w-full items-center justify-center bg-navy-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-500 hover:bg-navy-800 sm:text-xs lg:w-auto";

  return external ?
      <a
        href={shop.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {shop.label}
      </a>
    : <Link href={shop.href} className={className}>
        {shop.label}
      </Link>;
}

export default function HomeGiftShowcase({ initialSettings }: Props = {}) {
  const [settings, setSettings] = useState<StorefrontSettings | null>(
    () => initialSettings ?? null,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeReady, setFadeReady] = useState(true);

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

  const section = settings?.homeGiftShowcase;
  const cards = useMemo(
    () =>
      (section?.cards || []).filter(
        (c: HomeGiftShowcaseCard) =>
          (c?.title && c.title.trim()) ||
          (c?.description && c.description.trim()) ||
          (c?.image && c.image.trim()),
      ),
    [section?.cards],
  );

  const imageCards = useMemo(
    () => cards.filter((c) => c.image?.trim()),
    [cards],
  );

  useEffect(() => {
    if (imageCards.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setFadeReady(false);
      window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % imageCards.length);
        setFadeReady(true);
      }, 350);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [imageCards.length]);

  if (!section?.isActive || cards.length === 0) return null;

  const { lead: titleLead, accent: titleAccent } = splitTitle(
    section.headlineLine2 || "Gifting Studio",
  );
  const eyebrow = section.headlineLine1 || "The Art of Giving";

  const features = cards
    .filter((c) => c.title?.trim())
    .slice(0, 3)
    .map((c) => ({
      title: c.title!.trim(),
      description: c.description?.trim() || "",
    }));

  const slideIndex =
    imageCards.length > 0 ? activeIndex % imageCards.length : 0;
  const activeCard =
    imageCards[slideIndex] ?? cards[activeIndex % cards.length] ?? cards[0];

  return (
    <section
      className={cn(homeSectionStyles.pageBg, "bg-gray-50/60 py-14 sm:py-20 lg:py-24")}
      aria-label="Gifting collections"
    >
      <div className={homeSectionStyles.container}>
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 xl:gap-20">
          {/* Left — auto-fade image carousel */}
          <div className="order-2 lg:order-1">
            {imageCards.length > 0 ?
              <div className="mx-auto w-full max-w-xl border border-[#c5a059]/75 bg-white p-3 shadow-[0_12px_40px_rgba(20,25,47,0.08)] sm:p-4 lg:mx-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 ring-1 ring-[#c5a059]/25">
                {imageCards.map((card, index) => (
                  <div
                    key={`${card.title}-${index}-slide`}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-700 ease-in-out",
                      index === slideIndex && fadeReady ?
                        "opacity-100"
                      : "opacity-0",
                    )}
                    aria-hidden={index !== slideIndex}
                  >
                    <Image
                      src={card.image!}
                      alt={card.title || "Gift collection"}
                      fill
                      loader={cloudinaryLoader}
                      sizes="(max-width: 1024px) 90vw, 50vw"
                      className="object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      quality={75}
                      priority={index === 0}
                    />
                    {card.title?.trim() ?
                      <span className="absolute left-0 top-0 z-10 bg-navy-900 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white sm:text-[10px]">
                        {card.title.trim()}
                      </span>
                    : null}
                  </div>
                ))}

                {imageCards.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2 sm:bottom-4">
                    {imageCards.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`Show gift image ${index + 1}`}
                        onClick={() => {
                          setFadeReady(false);
                          window.setTimeout(() => {
                            setActiveIndex(index);
                            setFadeReady(true);
                          }, 200);
                        }}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          index === slideIndex ?
                            "w-6 bg-white"
                          : "w-1.5 bg-white/50 hover:bg-white/80",
                        )}
                      />
                    ))}
                  </div>
                )}
                </div>
              </div>
            : null}
          </div>

          {/* Right — copy + synced CTA */}
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
              {eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {titleAccent ?
                <>
                  {titleLead}{" "}
                  <span className="italic text-navy-900">{titleAccent}</span>
                </>
              : titleLead}
            </h2>
            {section.description ?
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base lg:mx-0">
                {section.description}
              </p>
            : null}

            {features.length > 0 && (
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left lg:mx-0 lg:max-w-none">
                {features.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span
                      className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#c5a059]/60 text-[10px] text-[#c5a059]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {item.title}
                      </p>
                      {item.description ?
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                          {item.description}
                        </p>
                      : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={cn(
                "mt-8 flex justify-center transition-opacity duration-500 lg:justify-start",
                fadeReady ? "opacity-100" : "opacity-0",
              )}
            >
              <ActiveGiftCta card={activeCard} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

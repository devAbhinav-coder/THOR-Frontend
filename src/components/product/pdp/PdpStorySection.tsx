"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Lightbulb,
  Truck,
  Package,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import RichTextContent from "@/components/ui/RichTextContent";
import { getPdpHighlights } from "@/lib/pdpHighlights";
import { buildPdpSpecRows } from "@/lib/pdpSpecRows";
import { resolvePdpMotionMedia } from "@/lib/instagramReel";
import { PdpInlineMotionPlayer } from "./PdpInlineMotionPlayer";
import { PdpMotionVideoModal } from "./PdpMotionVideoModal";
import { PdpMotionReelModal } from "./PdpMotionReelModal";

type AccordionId = "fabric" | "shipping" | "details" | "disclaimer";

type PdpStorySectionProps = {
  product: Product;
  selectedVariant: ProductVariant | null;
  motionVideoUrl?: string;
  motionReelUrl?: string;
  motionPosterUrl?: string;
};

const ACCORDION_ITEMS: {
  id: AccordionId;
  title: string;
  icon: typeof Lightbulb;
}[] = [
  { id: "fabric", title: "Fabric & Care", icon: Lightbulb },
  { id: "shipping", title: "Shipping & Returns", icon: Truck },
  { id: "details", title: "Product Details", icon: Package },
  { id: "disclaimer", title: "Disclaimer", icon: AlertTriangle },
];

const DEFAULT_CARE =
  "Gentle hand wash or dry clean recommended. Store away from direct sunlight to preserve colour and weave.";

export function PdpStorySection({
  product,
  selectedVariant,
  motionVideoUrl,
  motionReelUrl,
  motionPosterUrl,
}: PdpStorySectionProps) {
  const [openId, setOpenId] = useState<AccordionId | null>("fabric");
  const [motionVideoOpen, setMotionVideoOpen] = useState(false);
  const [motionReelOpen, setMotionReelOpen] = useState(false);
  const highlights = getPdpHighlights(product);
  const careText = product.careInstructions?.trim() || DEFAULT_CARE;

  const motion = useMemo(
    () =>
      resolvePdpMotionMedia({
        videoUrl: motionVideoUrl,
        reelUrl: motionReelUrl,
        posterUrl: motionPosterUrl,
      }),
    [motionVideoUrl, motionReelUrl, motionPosterUrl],
  );

  const specRows = useMemo(
    () =>
      buildPdpSpecRows({
        category: product.category,
        subcategory: product.subcategory,
        fabric: product.fabric,
        sku:
          selectedVariant?.sku ||
          (product.variants && product.variants[0]?.sku) ||
          "N/A",
        tags: product.tags,
        productDetails: product.productDetails,
      }),
    [product, selectedVariant],
  );

  const toggle = (id: AccordionId) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleMotionExpand = () => {
    if (motion.kind === "video") setMotionVideoOpen(true);
    else if (motion.kind === "reel") setMotionReelOpen(true);
  };

  const motionTitle = `See the ${product.category} in Motion`;
  const posterSrc = motion.posterUrl;

  return (
    <section className="mx-auto mt-4 max-w-7xl px-3 pb-8 sm:mt-6 sm:px-6 sm:pb-10 lg:px-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="border border-gray-200 bg-white lg:col-span-4">
          {ACCORDION_ITEMS.map(({ id, title, icon: Icon }) => {
            const isOpen = openId === id;
            return (
              <div key={id} className="border-b border-gray-200 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="flex w-full items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-[#faf8f4]/80 sm:gap-3 sm:px-5 sm:py-4"
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-[#c5a059] sm:h-4 sm:w-4"
                    strokeWidth={1.35}
                    aria-hidden
                  />
                  <span className="flex-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-900 sm:text-[11px] sm:tracking-[0.18em]">
                    {title}
                  </span>
                  {isOpen ?
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                  : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />}
                </button>

                {isOpen ?
                  <div className="space-y-2 px-3 pb-3 sm:space-y-3 sm:px-5 sm:pb-5">
                    {id === "fabric" ?
                      <>
                        {product.fabric ?
                          <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                            <span className="font-medium text-navy-900">
                              Fabric:
                            </span>{" "}
                            {product.fabric}
                          </p>
                        : null}
                        <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                          <span className="font-medium text-navy-900">
                            Care:
                          </span>{" "}
                          {careText}
                        </p>
                      </>
                    : null}

                    {id === "shipping" ?
                      <div className="space-y-2 text-xs leading-relaxed text-gray-600 sm:space-y-3 sm:text-sm">
                        <p>
                          <span className="font-medium text-navy-900">
                            Delivery:
                          </span>{" "}
                          Estimated 3–7 business days across India. Free shipping
                          on orders above ₹1,099.
                        </p>
                        <p>
                          <span className="font-medium text-navy-900">
                            Returns:
                          </span>{" "}
                          Easy 5-day return window on unused pieces with tags
                          intact. Refunds processed within 5–7 business days
                          after quality check.
                        </p>
                      </div>
                    : null}

                    {id === "details" ?
                      <div className="space-y-3 sm:space-y-4">
                        {product.description ?
                          <RichTextContent
                            text={product.description}
                            className="space-y-2 text-xs leading-relaxed text-gray-600 sm:space-y-3 sm:text-sm [&_p]:text-gray-600"
                          />
                        : null}
                        {specRows.length > 0 ?
                          <dl className="divide-y divide-gray-100 border-t border-gray-100 pt-1 sm:pt-2">
                            {specRows.map((row) => (
                              <div
                                key={`${row.label}-${row.value}`}
                                className="flex gap-2 py-2 first:pt-0 sm:gap-3 sm:py-2.5"
                              >
                                <dt className="w-20 shrink-0 text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-500 sm:w-24 sm:text-[10px] sm:tracking-[0.12em]">
                                  {row.label}
                                </dt>
                                <dd className="flex-1 break-words text-xs text-gray-800 sm:text-sm">
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        : null}
                      </div>
                    : null}

                    {id === "disclaimer" ?
                      <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                        Slight colour variation may occur due to screen settings
                        and natural fabric dyes. Measurements are approximate.
                        We photograph each piece in natural light — your saree
                        may look subtly different in person, which is normal
                        for handcrafted textiles.
                      </p>
                    : null}
                  </div>
                : null}
              </div>
            );
          })}
        </div>

        <div className="border border-[#c5a059]/25 bg-[#faf8f4] px-3 py-4 sm:px-6 sm:py-6 lg:col-span-4">
          <h2 className="font-serif text-base font-medium tracking-[0.06em] text-[#c5a059] sm:text-xl">
            Why You&apos;ll Love It
          </h2>
          <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3.5">
            {highlights.map((point) => (
              <li key={point} className="flex items-start gap-2 sm:gap-3">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c5a059] sm:h-4 sm:w-4"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-xs leading-relaxed text-gray-700 sm:text-sm">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {motion.kind === "video" || motion.kind === "reel" ?
          <PdpInlineMotionPlayer
            kind={motion.kind}
            videoUrl={motion.kind === "video" ? motion.videoUrl : undefined}
            embedUrl={motion.kind === "reel" ? motion.reelEmbedUrl ?? undefined : undefined}
            posterUrl={motion.posterUrl || undefined}
            title={motionTitle}
            onExpand={handleMotionExpand}
          />
        : motion.kind === "poster" ?
          <div
            className="relative min-h-[260px] overflow-hidden border border-gray-200 bg-gray-100 sm:min-h-[280px] lg:col-span-4"
            aria-label="Product photo preview"
          >
            {posterSrc ?
              <Image
                src={posterSrc}
                alt={`${product.name} detail preview`}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
            : null}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10">
              <div className="flex items-start gap-2.5">
                <ImageIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-white/90"
                  aria-hidden
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
                    Gallery preview
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    Swipe photos above for every angle. Add a motion video or
                    Instagram reel in admin to show movement here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        : null}
      </div>

      {motion.kind === "video" ?
        <PdpMotionVideoModal
          open={motionVideoOpen}
          videoUrl={motion.videoUrl}
          title={motionTitle}
          onClose={() => setMotionVideoOpen(false)}
        />
      : null}

      {motion.kind === "reel" && motion.reelEmbedUrl && motion.reelWatchUrl ?
        <PdpMotionReelModal
          open={motionReelOpen}
          embedUrl={motion.reelEmbedUrl}
          watchUrl={motion.reelWatchUrl}
          title={motionTitle}
          onClose={() => setMotionReelOpen(false)}
        />
      : null}
    </section>
  );
}

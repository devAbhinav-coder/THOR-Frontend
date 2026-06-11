"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Grid3X3,
  HelpCircle,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { aboutPageStyles } from "@/lib/aboutPageStyles";
import type { AboutInternalLink } from "@/components/about/aboutPageTypes";

type TabId = "shop" | "discover" | "help";

const TABS: { id: TabId; label: string; icon: typeof ShoppingBag }[] = [
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "discover", label: "Discover", icon: BookOpen },
  { id: "help", label: "Help & policies", icon: HelpCircle },
];

type Props = {
  shopLinks: AboutInternalLink[];
  discoverLinks: AboutInternalLink[];
  helpLinks: AboutInternalLink[];
};

function linkKey(link: AboutInternalLink) {
  return `${link.group}-${link.href}-${link.label}`;
}

export default function AboutExploreHub({
  shopLinks,
  discoverLinks,
  helpLinks,
}: Props) {
  const [active, setActive] = useState<TabId>("shop");

  const activeLinks = useMemo(() => {
    if (active === "shop") return shopLinks;
    if (active === "discover") return discoverLinks;
    return helpLinks;
  }, [active, shopLinks, discoverLinks, helpLinks]);

  const staticShop = shopLinks.filter((l) => !l.href.includes("/shop/category/"));
  const categoryShop = shopLinks.filter((l) => l.href.includes("/shop/category/"));

  return (
    <section
      className="relative py-20 sm:py-28"
      aria-labelledby="about-explore-heading"
    >
      <div className="absolute inset-0 bg-[#f5f2ec]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-about-reveal
          className="border border-[#c5a059]/35 bg-white shadow-[0_12px_40px_rgba(0,13,33,0.06)] overflow-hidden"
        >
          {/* Header band */}
          <div className="relative px-6 sm:px-10 pt-10 sm:pt-12 pb-8 border-b border-stone-100 bg-gradient-to-br from-[#faf9f7] via-white to-brand-50/30">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-brand-600">
                  Explore the house
                </p>
                <h2
                  id="about-explore-heading"
                  className="mt-3 font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-navy-900 leading-tight"
                >
                  Everything you may need next
                </h2>
                <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
                  Quick paths across our store — shop, collections, policies, and
                  styling — so you never lose the thread.
                </p>
              </div>
              <Link href="/shop" className={aboutPageStyles.ctaOutlineNavy}>
                <Grid3X3 className="h-4 w-4" aria-hidden />
                View all sarees
              </Link>
            </div>

            {/* Tabs */}
            <div
              className="mt-8 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Store sections"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`about-tab-${tab.id}`}
                    id={`about-tab-btn-${tab.id}`}
                    onClick={() => setActive(tab.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-300 sm:text-[11px]",
                      isActive
                        ? "bg-navy-900 text-white"
                        : "border border-gray-200/70 bg-white text-stone-600 hover:border-[#c5a059]/50 hover:text-navy-900",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel */}
          <div
            id={`about-tab-${active}`}
            role="tabpanel"
            aria-labelledby={`about-tab-btn-${active}`}
            className="px-4 sm:px-8 py-8 sm:py-10"
          >
            {active === "shop" ? (
              <div className="space-y-8">
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {staticShop.map((link, i) => (
                    <li key={linkKey(link)}>
                      <ExploreLinkCard link={link} index={i} featured={i === 0} />
                    </li>
                  ))}
                </ul>
                {categoryShop.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400 mb-4 px-1">
                      Collections
                    </p>
                    <ul className="flex flex-wrap gap-2 sm:gap-3">
                      {categoryShop.map((link) => (
                        <li key={linkKey(link)}>
                          <Link
                            href={link.href}
                            className="group inline-flex items-center gap-2 border border-gray-200/70 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:border-[#c5a059]/50 hover:text-[#c5a059]"
                          >
                            {link.label}
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/shop"
                          className={cn(aboutPageStyles.ctaNavy, "px-4 py-2.5 text-[11px]")}
                        >
                          All collections
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {activeLinks.map((link, i) => (
                  <li key={linkKey(link)}>
                    <ExploreLinkCard link={link} index={i} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreLinkCard({
  link,
  index,
  featured = false,
}: {
  link: AboutInternalLink;
  index: number;
  featured?: boolean;
}) {
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden p-5 sm:p-6 h-full min-h-[120px]",
        "border border-gray-200/70 bg-white",
        "transition-all duration-300 hover:border-[#c5a059]/50 hover:shadow-[0_10px_36px_rgba(0,13,33,0.06)]",
        featured && "sm:min-h-[140px] border-navy-900 bg-navy-900 text-white hover:border-navy-800",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold tabular-nums",
          featured ? "text-white/40" : "text-stone-300",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "font-serif text-lg font-bold leading-tight block",
              featured ? "text-white" : "text-navy-900 group-hover:text-brand-600 transition-colors",
            )}
          >
            {link.label}
          </span>
          <span
            className={cn(
              "mt-2 block text-xs leading-relaxed line-clamp-2",
              featured ? "text-white/70" : "text-stone-500",
            )}
          >
            {link.description}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center transition-colors duration-300",
            featured
              ? "border border-white/20 bg-white/10 text-white group-hover:bg-white group-hover:text-navy-900"
              : "border border-gray-200/70 bg-[#faf9f7] text-stone-500 group-hover:border-[#c5a059]/50 group-hover:bg-[#c5a059] group-hover:text-white",
          )}
        >
          <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

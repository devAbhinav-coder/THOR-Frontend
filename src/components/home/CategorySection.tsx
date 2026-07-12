"use client";

import { useState, useEffect, useMemo } from "react";
import { categoryApi } from "@/lib/api";
import { isGiftCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import {
  resolveGiftingCard,
  resolveSaleCard,
} from "@/lib/shopSpecialCollections";
import { Category, HomeExploreHouse } from "@/types";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";
import CategorySectionSkeleton from "@/components/home/CategorySectionSkeleton";
import ExploreHouseShowcaseCard, {
  type ExploreHouseCard,
} from "@/components/home/ExploreHouseShowcaseCard";

const FALLBACK_IMAGES: Record<string, string> = {
  saree: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
  leheng: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=85",
};

function getImageForCategory(cat: Category): string {
  if (cat.image) return cat.image;
  const lower = String(cat.name || "").toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85";
}

type CategorySectionProps = {
  initialCategories?: (Category & { productCount: number })[] | null;
  exploreHouseImages?: HomeExploreHouse | null;
};

function categorySubtitle(productCount?: number): string {
  return (productCount ?? 0) > 0 ? "THE COLLECTION" : "COMING SOON";
}

export default function CategorySection({
  initialCategories,
  exploreHouseImages,
}: CategorySectionProps = {}) {
  const [categories, setCategories] = useState<(Category & { productCount: number })[]>(() =>
    Array.isArray(initialCategories) ? initialCategories : []
  );
  const [loading, setLoading] = useState(() => !Array.isArray(initialCategories));

  useEffect(() => {
    if (Array.isArray(initialCategories)) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }
    categoryApi
      .getStats()
      .then((res) =>
        setCategories(
          ((res.data as { categories: Category[] }).categories || []).filter(
            (c): c is Category =>
              !!c && typeof c === "object" && typeof c.name === "string" && c.name.trim().length > 0
          )
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialCategories]);

  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => !isGiftCategory(c));
    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return list;
  }, [categories]);

  const saleCard = useMemo(
    () => resolveSaleCard(exploreHouseImages),
    [exploreHouseImages],
  );

  const giftingCard = useMemo(
    () => resolveGiftingCard(categories, exploreHouseImages),
    [categories, exploreHouseImages],
  );

  const showcaseCards = useMemo<ExploreHouseCard[]>(() => {
    const catalogCards: ExploreHouseCard[] = filteredCategories.map((cat) => {
      const hasProducts = (cat.productCount ?? 0) > 0;
      return {
        id: cat._id,
        name: cat.name,
        subtitle: categorySubtitle(cat.productCount),
        href: buildShopCategoryHref(cat),
        image: getImageForCategory(cat),
        comingSoon: !hasProducts,
      };
    });

    return [saleCard, ...catalogCards, giftingCard];
  }, [filteredCategories, saleCard, giftingCard]);

  if (loading) return <CategorySectionSkeleton />;

  if (showcaseCards.length === 0) return null;

  return (
    <section className="bg-[#f9f9f9] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 flex flex-col items-center justify-center text-center sm:mb-16">
          <h2 className="font-serif text-3xl text-[#1a1a1a] sm:text-4xl lg:text-[2.75rem] tracking-wide">
            Explore <span className="relative inline-block">
              Our
              <span className="absolute -bottom-2 left-0 right-0 h-[1px] bg-[#c5a059]" />
            </span> House
          </h2>
        </div>

        <div
          {...horizontalScrollSurfaceProps}
          className={`flex flex-nowrap justify-start gap-2.5 overflow-x-auto pb-1 sm:justify-center sm:gap-3 md:gap-4 lg:gap-5 lg:overflow-x-visible ${horizontalScrollSurfaceClassName} scrollbar-hide snap-x snap-mandatory`}
        >
          {showcaseCards.map((card, idx) => (
            <ExploreHouseShowcaseCard
              key={card.id}
              card={card}
              priority={idx < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

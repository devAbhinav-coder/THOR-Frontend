"use client";

import Image from "next/image";
import Link from "next/link";
import { Category, HomeExploreHouse } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import {
  GIFTING_HREF,
  SHOP_GIFTING_CARD,
  SHOP_SALE_CARD,
  resolveGiftingCardImage,
  resolveSaleCardImage,
} from "@/lib/shopSpecialCollections";
import {
  horizontalScrollSurfaceClassName,
  horizontalScrollSurfaceProps,
} from "@/lib/scrollSurface";

interface CategoryCardsProps {
  categories: Category[];
  exploreHouseImages?: HomeExploreHouse | null;
}

export default function CategoryCards({
  categories,
  exploreHouseImages,
}: CategoryCardsProps) {
  if (!categories || categories.length === 0) return null;

  const catalogCategories = [...categories]
    .filter(isShopCatalogCategory)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const giftingImage = resolveGiftingCardImage(categories, exploreHouseImages);
  const saleImage = resolveSaleCardImage(exploreHouseImages);

  const cards = [
    { ...SHOP_SALE_CARD, image: saleImage },
    ...catalogCategories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      href: `/shop/collections/${encodeURIComponent(cat.slug)}`,
      image: cat.image || "/placeholder-collection.png",
    })),
    { ...SHOP_GIFTING_CARD, image: giftingImage, href: GIFTING_HREF },
  ];

  return (
    <div className="w-full mb-3 sm:mb-4">
      <div
        {...horizontalScrollSurfaceProps}
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-hide sm:gap-4 ${horizontalScrollSurfaceClassName}`}
      >
        {cards.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative block aspect-[4/5] w-[140px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#c5a059]/30 bg-rose-50 shadow-sm transition-all hover:border-[#c5a059] hover:shadow-md sm:w-[180px] lg:w-[200px]"
          >
            <Image
              src={cat.image || "/placeholder-collection.png"}
              alt={cat.name}
              fill
              className="card-hover-zoom object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 160px, 200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
              <span className="text-white font-medium text-sm sm:text-base tracking-wide drop-shadow-sm group-hover:text-[#c5a059] transition-colors text-center">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

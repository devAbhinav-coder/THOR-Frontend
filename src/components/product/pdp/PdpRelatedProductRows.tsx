"use client";

import Link from "next/link";
import { useMemo } from "react";
import ShopCollectionCard from "@/components/shop/ShopCollectionCard";
import HorizontalScrollRow from "@/components/ui/HorizontalScrollRow";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import { colorHasTaggedImages } from "@/lib/pdpImages";
import { getDistinctVariantColors } from "@/lib/shopProductListing";
import type { Product } from "@/types";

export interface PdpRelatedProductRowsProps {
  product: Product;
  isGiftMarketingContext: boolean;
  relatedProducts: Product[];
  moreProducts: Product[];
}

const PDP_CARD_CLASS =
  "w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]";

/** One card per product on PDP rows — pick the best shade thumbnail when multi-color. */
function pdpRowListingEntries(products: Product[]) {
  return products.slice(0, 12).map((product) => {
    const colors = getDistinctVariantColors(product);
    let displayColor: string | null = colors[0] ?? null;
    if (colors.length > 1) {
      const withPhoto = colors.find((c) => colorHasTaggedImages(product, c));
      displayColor = withPhoto ?? colors[0] ?? null;
    }
    return {
      product,
      displayColor,
      listKey: String(product._id),
    };
  });
}

function ProductScrollRow({ products }: { products: Product[] }) {
  const entries = useMemo(
    () => pdpRowListingEntries(products),
    [products],
  );
  return (
    <HorizontalScrollRow innerClassName="gap-1 sm:gap-2">
      {entries.map((entry) => (
        <div key={entry.listKey} className={PDP_CARD_CLASS}>
          <ShopCollectionCard
            product={entry.product}
            displayColor={entry.displayColor}
            allowImageFallback
          />
        </div>
      ))}
    </HorizontalScrollRow>
  );
}

export function PdpRelatedProductRows({
  product,
  isGiftMarketingContext,
  relatedProducts,
  moreProducts,
}: PdpRelatedProductRowsProps) {
  const categoryPath = `/shop/collections/${encodeURIComponent(toShopCategorySlug(product.category))}`;
  return (
    <>
      {relatedProducts.length > 0 && (
        <section className='border-t border-gray-100 bg-white py-10 sm:py-14'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0'>
            <div className='mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between'>
              <div className='text-left'>
                <p className='text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059]'>
                  Curated For You
                </p>
                <h2 className='mt-3 font-serif text-2xl font-medium text-navy-900 sm:text-3xl'>
                  {isGiftMarketingContext ?
                    "Similar Gifting Products"
                  : "You Might Also Like"}
                </h2>
              </div>
              <Link
                href={
                  isGiftMarketingContext ? "/gifting" : (
                    `${categoryPath}${product.fabric ? `?fabric=${encodeURIComponent(product.fabric)}` : ""}`
                  )
                }
                className='shrink-0 text-[11px] font-medium uppercase tracking-[0.22em] text-navy-900 underline decoration-[#c5a059]/80 underline-offset-[6px] transition-colors hover:text-[#c5a059]'
              >
                View All
              </Link>
            </div>
            <ProductScrollRow products={relatedProducts} />
          </div>
        </section>
      )}

      {moreProducts.length > 0 && (
        <section className='border-t border-gray-100 bg-gray-50/50 py-10 sm:py-14'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0'>
            <div className='mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between'>
              <div className='text-left'>
                <p className='text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059]'>
                  Explore More
                </p>
                <h2 className='mt-3 font-serif text-2xl font-medium text-navy-900 sm:text-3xl'>
                  {isGiftMarketingContext ?
                    "More Gift Products"
                  : "More from The House of Rani"}
                </h2>
              </div>
              <Link
                href={isGiftMarketingContext ? "/gifting" : "/shop"}
                className='shrink-0 text-[11px] font-medium uppercase tracking-[0.22em] text-navy-900 underline decoration-[#c5a059]/80 underline-offset-[6px] transition-colors hover:text-[#c5a059]'
              >
                Explore All
              </Link>
            </div>
            <ProductScrollRow products={moreProducts} />
          </div>
        </section>
      )}
    </>
  );
}

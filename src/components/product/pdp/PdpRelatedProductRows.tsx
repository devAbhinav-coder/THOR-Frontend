"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";

export interface PdpRelatedProductRowsProps {
  product: Product;
  isGiftMarketingContext: boolean;
  relatedProducts: Product[];
  moreProducts: Product[];
}

export function PdpRelatedProductRows({
  product,
  isGiftMarketingContext,
  relatedProducts,
  moreProducts,
}: PdpRelatedProductRowsProps) {
  return (
    <>
      {relatedProducts.length > 0 && (
        <section className='py-8 sm:py-12 bg-[#faf9f7] overflow-x-hidden'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0'>
            <div className='flex items-end justify-between mb-5 sm:mb-7'>
              <div>
                <p className='text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1'>
                  You might also like
                </p>
                <h2 className='text-xl sm:text-3xl font-serif font-bold text-navy-900'>
                  {isGiftMarketingContext ?
                    "Similar Gift Products"
                  : "Similar Styles"}
                </h2>
              </div>
              <Link
                href={
                  isGiftMarketingContext ?
                    "/gifting"
                  : `/shop?category=${encodeURIComponent(product.category)}${product.fabric ? `&fabric=${encodeURIComponent(product.fabric)}` : ""}`
                }
                className='text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors'
              >
                View all <ChevronRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='sm:hidden w-full min-w-0 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x'>
              {relatedProducts.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  className='w-[calc((100%-0.75rem)/2)] min-w-[170px] max-w-[240px] shrink-0 snap-start'
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className='hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0'>
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {moreProducts.length > 0 && (
        <section className='py-8 sm:py-12 bg-white overflow-x-hidden'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0'>
            <div className='flex items-end justify-between mb-5 sm:mb-7'>
              <div>
                <p className='text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1'>
                  Curated for you
                </p>
                <h2 className='text-xl sm:text-3xl font-serif font-bold text-navy-900'>
                  {isGiftMarketingContext ?
                    "More Gift Products"
                  : "More from The House of Rani"}
                </h2>
              </div>
              <Link
                href={isGiftMarketingContext ? "/gifting" : "/shop"}
                className='text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors'
              >
                Explore all <ChevronRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='sm:hidden w-full min-w-0 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x'>
              {moreProducts.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  className='w-[calc((100%-0.75rem)/2)] min-w-[170px] max-w-[240px] shrink-0 snap-start'
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className='hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0'>
              {moreProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

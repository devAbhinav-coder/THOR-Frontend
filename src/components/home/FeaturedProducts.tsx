"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import FeaturedProductCard from "@/components/home/FeaturedProductCard";
import FeaturedProductCardSkeleton from "@/components/home/FeaturedProductCardSkeleton";
import HorizontalScrollRow from "@/components/ui/HorizontalScrollRow";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

const FEATURED_CARD_CLASS =
  "w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.9375rem)]";

type FeaturedProductsProps = {
  /** Server-prefetched; `null` = prefetch failed, client will fetch. */
  initialProducts?: Product[] | null;
};

export default function FeaturedProducts({
  initialProducts,
}: FeaturedProductsProps = {}) {
  const [products, setProducts] = useState<Product[]>(() =>
    Array.isArray(initialProducts) ? initialProducts : [],
  );
  const [isLoading, setIsLoading] = useState(
    () => !Array.isArray(initialProducts),
  );

  useEffect(() => {
    if (Array.isArray(initialProducts)) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }
    const fetchFeatured = async () => {
      try {
        const res = await productApi.getFeatured();
        setProducts(res.data.products);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, [initialProducts]);

  return (
    <section
      className="bg-[#000d21] py-14 sm:py-20 lg:py-24"
      aria-labelledby="featured-products-heading"
    >
      <div className={homeSectionStyles.container}>
        <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs">
              Curated Selection
            </p>
            <h2
              id="featured-products-heading"
              className="mt-3 font-serif text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
            >
              Featured Masterpieces
            </h2>
          </div>

          <Link
            href="/shop?isFeatured=true"
            className="shrink-0 self-start text-[11px] font-medium uppercase tracking-[0.22em] text-white underline decoration-white/80 underline-offset-[6px] transition-colors hover:text-[#c5a059] hover:decoration-[#c5a059] sm:self-auto sm:text-xs"
          >
            View All Works
          </Link>
        </div>

        <HorizontalScrollRow
          variant="dark"
          className={cn(
            isLoading && "min-h-[280px] sm:min-h-[360px]",
          )}
          innerClassName="items-stretch [&>*]:h-full [&>*]:min-h-0"
        >
          {isLoading ?
            [...Array(4)].map((_, i) => (
              <div key={i} className={FEATURED_CARD_CLASS}>
                <FeaturedProductCardSkeleton />
              </div>
            ))
          : products.map((product) => (
              <div key={product._id} className={FEATURED_CARD_CLASS}>
                <FeaturedProductCard product={product} />
              </div>
            ))
          }
        </HorizontalScrollRow>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

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
      className={cn(homeSectionStyles.pageBg, "py-2 sm:py-6")}
      aria-labelledby='featured-products-heading'
    >
      <div className={homeSectionStyles.container}>
        <div className='mb-6 sm:mb-10'>
          <HomeSectionHeader
            id='featured-products-heading'
            eyebrow='Handpicked for You'
            title='Featured Products'
          />
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 place-items-center'>
          {isLoading ?
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className='w-full max-w-[210px] sm:max-w-[250px] lg:max-w-[280px]'
              >
                <ProductCardSkeleton />
              </div>
            ))
          : products.slice(0, 4).map((product) => (
              <div
                key={product._id}
                className='w-full max-w-[210px] sm:max-w-[250px] lg:max-w-[280px]'
              >
                <ProductCard product={product} className='w-full' />
              </div>
            ))
          }
        </div>

        <div className='mt-10 text-center'>
          <Link
            href='/shop?isFeatured=true'
            className='inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors'
          >
            Explore Featured <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}

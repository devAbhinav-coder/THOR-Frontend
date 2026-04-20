"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";

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
    <section className='py-2 sm:py-6 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'>
        <div className='flex items-end justify-between mb-6 sm:mb-10'>
          <div>
            <p className='text-brand-600 font-medium uppercase tracking-wider text-xs sm:text-sm mb-1'>
              Handpicked for You
            </p>
            <h2 className='text-2xl sm:text-4xl font-serif font-bold text-gray-900'>
              Featured Products
            </h2>
          </div>
          <Link
            href='/shop?isFeatured=true'
            className='hidden sm:flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors'
          >
            View All <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        <div className='flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {isLoading ?
            [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 4).map((product) => (
              <div
                key={product._id}
                className='min-w-[130px] max-w-[130px] sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[260px] lg:max-w-[260px] flex-shrink-0'
              >
                <ProductCard product={product} className='w-full' />
              </div>
            ))
          }
        </div>

        <div className='mt-10 text-center sm:hidden'>
          <Link
            href='/shop?isFeatured=true'
            className='inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors'
          >
            View All <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}

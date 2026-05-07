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
        <div className='mb-6 sm:mb-10'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-3 text-brand-600'>
              <span className='h-px w-12 bg-brand-200 sm:w-16' />
              <p className='font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs'>
                Handpicked for You
              </p>
              <span className='h-px w-12 bg-brand-200 sm:w-16' />
            </div>
            <h2 className='mt-3 text-3xl sm:text-5xl font-serif text-navy-900'>
              Featured Products
            </h2>
          </div>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 place-items-center'>
          {isLoading ?
            [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
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

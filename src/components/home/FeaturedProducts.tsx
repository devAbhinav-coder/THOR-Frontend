'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { productApi } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <section className="py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-600 font-medium uppercase tracking-wider text-sm mb-2">Handpicked for You</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">Featured Products</h2>
          </div>
          <Link
            href="/shop?isFeatured=true"
            className="hidden sm:flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading
            ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 4).map((product) => (
     <div key={product._id} className="min-w-[220px] max-w-[220px] sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[260px] lg:max-w-[260px] flex-shrink-0">
  <ProductCard product={product} className="w-full" />
</div>
              ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop?isFeatured=true"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

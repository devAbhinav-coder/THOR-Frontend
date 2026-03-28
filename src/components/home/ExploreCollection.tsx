"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonLoader";

export default function ExploreCollection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await productApi.getAll({ limit: 16, sort: "-createdAt" });
        setProducts(res.data.products || []);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-600 font-medium uppercase tracking-wider text-sm mb-2">
              Just Dropped
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">
              Explore the Collection
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl">
              Fresh picks across categories — curated to feel premium, minimal, and easy to shop.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 16).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}


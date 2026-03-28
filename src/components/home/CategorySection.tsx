"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, ArrowRight } from "lucide-react";
import { categoryApi } from "@/lib/api";
import { Category } from "@/types";

const FALLBACK_IMAGES: Record<string, string> = {
  saree: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
  leheng:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=85",
  salwar:
    "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=600&q=85",
  suit: "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=600&q=85",
  kurti:
    "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=85",
  dupatta:
    "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&q=85",
  blouse:
    "https://images.unsplash.com/photo-1603217039863-aa0c865404f7?w=600&q=85",
  accessor:
    "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&q=85",
};

function getImageForCategory(cat: Category): string {
  if (cat.image) return cat.image;
  const lower = cat.name.toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85";
}

/* ── Skeleton ────────────────────────────────────────────── */
function CategorySkeleton() {
  return (
    <section className='py-16 bg-[#faf9f7]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-10'>
          <div className='h-3 w-24 bg-gray-200 rounded-full animate-pulse mx-auto mb-3' />
          <div className='h-8 w-60 bg-gray-200 rounded-full animate-pulse mx-auto' />
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse'
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Main Section ────────────────────────────────────────── */
export default function CategorySection() {
  const [categories, setCategories] = useState<
    (Category & { productCount: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getStats()
      .then((res) => setCategories((res.data as { categories: Category[] }).categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CategorySkeleton />;

  if (categories.length === 0) {
    return (
      <section className='py-16 bg-[#faf9f7]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-brand-600 font-semibold uppercase tracking-widest text-xs mb-2'>
            Browse by Category
          </p>
          <h2 className='text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-6'>
            Shop Our Collections
          </h2>
          <div className='flex flex-col items-center gap-3 py-12'>
            <Tag className='w-12 h-12 text-gray-300' />
            <p className='text-sm text-gray-400'>
              Categories will appear here once added from the admin panel.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-16 sm:py-20 bg-[#faf9f7]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8'>
          <div>
            <p className='text-brand-600 font-semibold uppercase tracking-widest text-xs mb-2'>
              Browse by Category
            </p>
            <h2 className='text-3xl sm:text-4xl font-serif font-bold text-navy-900'>
              Shop Our Collections
            </h2>
          </div>
          <Link
            href='/shop'
            className='inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors group'
          >
            View All
            <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
          </Link>
        </div>

        {/* Simple uniform portrait grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5'>
          {categories.map((cat, index) => {
            const imgSrc = getImageForCategory(cat);
            return (
              <Link
                key={cat._id}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className='group block'
              >
                {/* Portrait card — object-contain so full image always shows */}
                <div
                  className='relative overflow-hidden rounded-xl'
                  style={{ aspectRatio: "3/4", background: "#f0ebe4" }}
                >
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                    className='object-contain transition-transform duration-500 group-hover:scale-105'
                    priority={index < 4}
                  />
                  {/* Gradient overlay only at bottom for text */}
                  <div className='absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent' />

                  {/* Category name on image */}
                  <div className='absolute bottom-0 left-0 right-0 p-3 sm:p-4'>
                    <h3 className='text-white font-serif font-semibold text-sm sm:text-base leading-snug'>
                      {cat.name}
                    </h3>
                    {cat.productCount > 0 && (
                      <p className='text-white/70 text-xs mt-0.5'>
                        {cat.productCount}{" "}
                        {cat.productCount === 1 ? "product" : "products"}
                      </p>
                    )}
                    {cat.productCount === 0 && (
                      <p className='text-white/50 text-xs mt-0.5'>
                        Coming soon
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

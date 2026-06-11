"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, PenLine } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import WishlistCard from "@/components/wishlist/WishlistCard";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { Button } from "@/components/ui/button";

export default function WishlistPageClient() {
  const { products, isLoading, fetchWishlist } = useWishlistStore();
  const { isAuthenticated, isLoading: authLoading, _hasHydrated, hasSessionChecked } =
    useAuthStore();
  const count = products.length;

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchWishlist();
  }, [fetchWishlist, isAuthenticated]);

  if (!_hasHydrated || !hasSessionChecked || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f8f9fa]">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading wishlist…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[min(70vh,calc(100dvh-14rem))] flex-col items-center justify-center bg-[#f8f9fa] px-4 py-12">
        <div className="w-full max-w-md rounded-none border border-gray-200 bg-white px-6 py-10 text-center sm:px-8 sm:py-12">
          <Heart className="mx-auto mb-5 h-10 w-10 text-[#c5a059]" strokeWidth={1.25} />
          <h1 className="mb-2 font-serif text-2xl font-medium text-navy-900">
            Sign in to view your archive
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-gray-600">
            Save sarees you love and return to your curated list anytime.
          </p>
          <Button asChild variant="brand" size="lg" className="min-w-[200px]">
            <Link href={loginUrlWithRedirect("/wishlist")} scroll={false}>
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12 pt-8 sm:pt-10 lg:pb-16 lg:pt-12">
      <section className="mb-8 px-4 sm:mb-10 sm:px-6 lg:mb-12 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center space-y-3 text-center sm:space-y-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c5a059] sm:text-[11px]">
            Your Personal Selection
          </span>
          <h1 className="font-serif text-3xl font-semibold italic tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
            The Curated List
          </h1>
          <div className="gold-divider w-20 sm:w-24" aria-hidden />
          <p className="max-w-2xl pt-2 text-sm leading-relaxed text-gray-600 sm:pt-3 sm:text-base">
            A selection of heritage pieces reserved for your consideration.
            Artisanal sarees and ethnic wear, curated for you at The House of
            Rani.
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-[11px]">
            {isLoading ? "Loading…" : `(${count} ${count === 1 ? "ITEM" : "ITEMS"})`}
          </p>
        </div>
      </section>

      {isLoading ? (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="aspect-[2/3] w-full rounded-none bg-gray-200" />
                <Skeleton className="mt-4 h-3 w-1/3 rounded" />
                <Skeleton className="mt-2 h-5 w-4/5 rounded" />
                <Skeleton className="mt-2 h-4 w-full rounded" />
                <Skeleton className="mt-3 h-5 w-24 rounded" />
              </div>
            ))}
          </div>
        </section>
      ) : count === 0 ? (
        <section className="border-t border-gray-200/80 bg-[#f3f4f5] px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-md space-y-5 text-center">
            <PenLine
              className="mx-auto h-10 w-10 text-gray-300 sm:h-12 sm:w-12"
              strokeWidth={1.25}
              aria-hidden
            />
            <h2 className="font-serif text-xl font-medium text-navy-900 sm:text-2xl">
              Curating your Legacy
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              The House of Rani celebrates the timeless journey of the saree. Add
              pieces to your archive to build a collection that transcends
              generations.
            </p>
            <Link
              href="/shop"
              className="inline-block border-b border-navy-900 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
            >
              Return to Collections
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
              {products.map((product) => (
                <WishlistCard key={product._id} product={product} />
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
            <div className="relative flex h-[240px] items-center justify-center overflow-hidden sm:h-[320px] lg:h-[380px]">
              <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-[#5d4201]/80" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(201,160,89,0.35), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08), transparent 40%)",
                }}
                aria-hidden
              />
              <div className="relative z-10 max-w-lg px-6 text-center text-white">
                <h2 className="font-serif text-2xl font-medium italic sm:text-3xl lg:text-4xl">
                  Complete the Ensemble
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base">
                  Discover more handcrafted drapes and celebration-ready styles
                  designed to complement your curated archive.
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-block border border-[#e9c176] px-8 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e9c176] transition-all duration-300 hover:bg-[#e9c176] hover:text-navy-900 sm:mt-8 sm:px-10 sm:py-3.5 sm:text-[11px]"
                >
                  Explore Collections
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

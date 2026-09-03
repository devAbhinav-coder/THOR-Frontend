"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Home,
  Sparkles,
  ShoppingBag,
  Gift,
  HelpCircle,
  ChevronRight,
  Crown,
  Tag,
  Loader2,
} from "lucide-react";

import { categoryApi } from "@/lib/api";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { isGiftCategory } from "@/lib/categoryFilters";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import type { Category } from "@/types";

const FALLBACK_IMAGES: Record<string, string> = {
  saree: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=85",
  suit: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=85",
  gift: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=85",
  leheng: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
  default: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85",
};

function getCategoryImage(cat: Category): string {
  if (cat.image && typeof cat.image === "string" && cat.image.trim().length > 0) {
    return cat.image;
  }
  const nameLower = String(cat.name || "").toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (nameLower.includes(key)) return url;
  }
  return FALLBACK_IMAGES.default;
}

const DEFAULT_CATEGORY_CARDS = [
  {
    _id: "sarees-default",
    name: "Royal Sarees",
    slug: "sarees",
    productCount: 24,
    image: FALLBACK_IMAGES.saree,
    href: "/shop/collections/sarees",
  },
  {
    _id: "salwar-suits-default",
    name: "Salwar Suits",
    slug: "salwar-suits",
    productCount: 18,
    image: FALLBACK_IMAGES.suit,
    href: "/shop/collections/salwar-suits",
  },
  {
    _id: "gifting-default",
    name: "Luxury Gifting",
    slug: "gifting",
    productCount: 12,
    image: FALLBACK_IMAGES.gift,
    href: "/gifting",
  },
  {
    _id: "lehengas-default",
    name: "Bridal & Lehengas",
    slug: "lehengas",
    productCount: 15,
    image: FALLBACK_IMAGES.leheng,
    href: "/shop/collections/lehengas",
  },
];

const SEARCH_SHORTCUTS = [
  { label: "Sarees", href: "/shop?search=saree" },
  { label: "Salwar Suits", href: "/shop?search=salwar%20suit" },
  { label: "Corsets", href: "/shop?search=corsets" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "All Collections", href: "/shop" },
];

export default function NotFoundClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<
    { _id: string; name: string; slug?: string; image?: string; href: string; productCount?: number }[]
  >(DEFAULT_CATEGORY_CARDS);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch dynamic categories from backend API
  useEffect(() => {
    let isMounted = true;
    categoryApi
      .getStats()
      .then((res) => {
        if (!isMounted) return;
        const fetched = (res.data as { categories: Category[] })?.categories || [];
        const validCategories = fetched.filter(
          (c): c is Category =>
            !!c &&
            typeof c === "object" &&
            typeof c.name === "string" &&
            c.name.trim().length > 0 &&
            !isGiftCategory(c)
        );

        if (validCategories.length > 0) {
          const formatted = validCategories.map((cat) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            image: getCategoryImage(cat),
            href: buildShopCategoryHref(cat),
            productCount: (cat as any).productCount ?? 0,
          }));

          // Always append Gifting card if not present
          formatted.push({
            _id: "gifting-card",
            name: "Luxury Gifting",
            slug: "gifting",
            image: FALLBACK_IMAGES.gift,
            href: "/gifting",
            productCount: 12,
          });

          setCategories(formatted);
        }
      })
      .catch((err) => {
        console.warn("Failed to load dynamic categories for 404 page, using defaults:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <div className="w-full bg-[#fdfbf7] text-[#1a1a1a] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* ── Header Section ── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-xs font-semibold uppercase tracking-[0.2em]">
            <Crown className="w-3.5 h-3.5" />
            <span>404 • Page Not Found</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1a1a1a] tracking-wide leading-tight">
            Lost In{" "}
            <span className="relative inline-block text-[#c5a059]">
              Royal
              <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#c5a059]" />
            </span>{" "}
            Couture?
          </h1>

          <p className="text-sm sm:text-base text-gray-600 font-sans leading-relaxed pt-1">
            The page or collection you are looking for might have been moved, renamed, or is temporarily out of stock. Search our catalog below or explore our house collections.
          </p>
        </div>

        {/* ── Search Form & Shortcuts Section ── */}
        <div className="max-w-xl mx-auto w-full space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-sm">
            <div className="absolute left-4 text-[#c5a059] pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sarees, salwar suits, lehengas..."
              className="w-full pl-12 pr-32 py-3.5 rounded-xl bg-white border border-[#c5a059]/40 text-[#1a1a1a] placeholder-gray-400 text-sm focus:outline-none focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-lg bg-[#c5a059] hover:bg-[#b8924d] text-white font-medium text-xs sm:text-sm tracking-wide uppercase transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span>Search</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Search Shortcut Buttons (Fully Functional Links & Router Actions) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#c5a059]" /> Shortcuts:
            </span>
            {SEARCH_SHORTCUTS.map((tag, idx) => (
              <Link
                key={idx}
                href={tag.href}
                className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#c5a059] hover:bg-[#c5a059]/10 text-gray-800 hover:text-[#c5a059] text-xs font-medium transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{tag.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Main Action Buttons ── */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1a1a1a] hover:bg-[#c5a059] text-white font-medium text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c5a059] hover:bg-[#b8924d] text-white font-medium text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Shop</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-gray-300 hover:border-[#1a1a1a] text-gray-800 font-medium text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#c5a059]" />
            <span>Go Back</span>
          </button>
        </div>

        {/* ── Dynamic "Explore Our House" Categories Section ── */}
        <div className="pt-8 border-t border-[#c5a059]/20 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-serif text-3xl text-[#1a1a1a] sm:text-4xl tracking-wide">
              Explore{" "}
              <span className="relative inline-block">
                Our
                <span className="absolute -bottom-1.5 left-0 right-0 h-[1px] bg-[#c5a059]" />
              </span>{" "}
              House
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest pt-1">
              Handcrafted Luxury Indian Ethnic Attire
            </p>
          </div>

          {loadingCategories ? (
            <div className="flex items-center justify-center py-12 text-[#c5a059]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2 text-xs font-medium uppercase tracking-wider text-gray-500">Loading house collections...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {categories.slice(0, 8).map((card) => (
                <Link
                  key={card._id}
                  href={card.href}
                  className="group block overflow-hidden border border-[#c5a059]/35 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "3/4" }}>
                    <Image
                      src={card.image || FALLBACK_IMAGES.default}
                      alt={card.name}
                      fill
                      loader={card.image?.includes("cloudinary") ? cloudinaryLoader : undefined}
                      sizes="(max-width: 640px) 48vw, (max-width: 1024px) 25vw, 300px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    
                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-3 pb-4 text-center text-white">
                      <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-white">
                        {card.name}
                      </h3>
                      {card.productCount !== undefined && card.productCount > 0 ? (
                        <p className="mt-1 line-clamp-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.14em] text-[#d4b87a]">
                          {card.productCount} Products Available
                        </p>
                      ) : (
                        <p className="mt-1 line-clamp-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.14em] text-[#d4b87a]">
                          EXPLORE COLLECTION
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Concierge Support Footer Note ── */}
        <div className="text-center text-xs text-gray-500 pt-4">
          Need styling advice or order tracking help?{" "}
          <Link href="/faq" className="text-[#c5a059] font-medium underline underline-offset-4 hover:text-[#b8924d]">
            Visit House of Rani Support & Concierge
          </Link>
        </div>

      </div>
    </div>
  );
}

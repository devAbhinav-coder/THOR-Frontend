"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { storefrontApi } from "@/lib/api";
import { StorefrontSettings } from "@/types";

export default function HomeBanner() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const promo = settings?.promoBanner;

  if (!promo?.title || !promo?.backgroundImage) return null;
  const perks =
    promo?.perks?.length ?
      promo.perks.slice(0, 3)
    : ["Premium fabrics", "Curated colors", "Easy to shop"];

  return (
    <section className='py-10 sm:py-12 bg-[#faf9f7]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-brand-50 shadow-sm'>
          {/* Soft image layer */}
          <div className='absolute inset-0 opacity-[0.18]'>
            <Image
              src={
                promo?.backgroundImage ||
                "https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?w=1600&q=80&auto=format&fit=crop"
              }
              alt='Fabric texture background'
              fill
              sizes='(max-width: 1024px) 100vw, 1200px'
              className='object-cover'
              priority={false}
            />
          </div>

          {/* Gradient overlay for readability */}
          <div className='absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/30' />

          <div className='relative p-6 sm:p-10'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
              <div className='max-w-2xl'>
                <p className='text-xs font-semibold text-brand-700 uppercase tracking-[0.2em]'>
                  {promo?.eyebrow || "The House of Rani"}
                </p>
                <h3 className='mt-2 text-2xl sm:text-3xl font-serif font-bold text-navy-900 leading-tight'>
                  {promo?.title ||
                    "Festive-ready pieces, crafted to feel timeless."}
                </h3>
                <p className='mt-3 text-sm sm:text-base text-gray-600 leading-relaxed'>
                  {promo?.description ||
                    "Discover fresh drops across sarees, lehengas, and more — handpicked for rich fabrics, elegant colors, and flattering drapes."}
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-3'>
                <Link
                  href={promo?.primaryButtonLink || "/shop?sort=-createdAt"}
                  className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm'
                >
                  {promo?.primaryButtonText || "Shop New Arrivals"}{" "}
                  <ArrowRight className='h-4 w-4' />
                </Link>
                <Link
                  href={promo?.secondaryButtonLink || "/shop"}
                  className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur border border-gray-200 text-navy-900 text-sm font-semibold hover:bg-white transition-colors'
                >
                  {promo?.secondaryButtonText || "Browse All"}
                </Link>
              </div>
            </div>

            {/* Tiny perks row */}
            <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600'>
              {perks.map((perk) => (
                <div
                  key={perk}
                  className='rounded-2xl bg-white/70 border border-gray-100 px-4 py-3'
                >
                  <p className='font-semibold text-gray-900'>{perk}</p>
                  <p className='mt-0.5 text-gray-600'>
                    Designed for a better shopping experience
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

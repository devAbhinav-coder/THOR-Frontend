"use client";

import Image from "next/image";
import Link from "next/link";
import PremiumFadeIn from "@/components/premium/PremiumFadeIn";
import PremiumWishlistButton from "@/components/premium/PremiumWishlistButton";
import {
  PREMIUM_CRAFT_IMAGE,
  PREMIUM_EDITORIAL_IMAGE,
  PREMIUM_HERO_IMAGE,
} from "@/lib/premiumCollectionData";
import type { PremiumProductView } from "@/lib/premiumProductMapper";
import { formatPrice } from "@/lib/utils";

type Props = {
  products: PremiumProductView[];
};

export default function PremiumCollectionClient({ products }: Props) {
  return (
    <div className='bg-[#fcf9f8] text-[#1a1a1a]'>
      {/* Hero */}
      <header className='relative h-[100svh] w-full overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <Image
            src={PREMIUM_HERO_IMAGE}
            alt='Premium Saree Campaign'
            fill
            priority
            className='scale-105 object-cover object-center'
            sizes='100vw'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
        </div>

        <div className='relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-12 md:px-16 md:pb-16'>
          <PremiumFadeIn className='max-w-2xl text-white'>
            <p className='mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80'>
              The House of Rani
            </p>
            <h1 className='font-serif text-[clamp(3rem,10vw,5rem)] font-bold leading-[0.95] tracking-tight'>
              PREMIUM
            </h1>
            <p className='mt-6 max-w-lg text-lg font-light text-white/90'>
              The Rani Premium Edit
            </p>
            <a
              href='#collection'
              className='mt-10 inline-block border border-white px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white hover:text-account-primary'
            >
              Explore Premium
            </a>
          </PremiumFadeIn>
        </div>
      </header>

      {/* Introduction */}
      <section className='px-5 py-4 text-center md:px-16 md:py-8'>
        <PremiumFadeIn className='mx-auto max-w-3xl'>
          <h2 className='font-serif text-2xl font-medium tracking-wide md:text-3xl'>
            THE PREMIUM EDIT
          </h2>
          <p className='mt-8 text-lg font-light leading-relaxed text-account-on-surface-variant'>
            A carefully curated selection of our most exceptional sarees. Woven
            from the rarest silks and embellished with masterful zari, these
            pieces represent the pinnacle of artisanal legacy. For the
            discerning few who seek the extraordinary.
          </p>
          <div className='mx-auto mt-12 h-px w-12 bg-account-primary opacity-30' />
        </PremiumFadeIn>
      </section>

      {/* Product grid */}
      <section
        id='collection'
        className='mx-auto max-w-[1280px] px-5 py-6 md:px-16'
      >
        <div className='grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-10'>
          {products.map((product, index) => (
            <PremiumFadeIn
              key={product.slug}
              className={index % 2 === 1 ? "md:mt-16" : undefined}
            >
              <Link href={`/premium/${product.slug}`} className='group block'>
                <div className='relative mb-6 aspect-[3/4] overflow-hidden bg-account-surface-variant'>
                  <Image
                    src={product.heroImage}
                    alt={product.name}
                    fill
                    className='object-cover transition-transform duration-700 ease-out group-hover:scale-105'
                    sizes='(max-width: 768px) 100vw, 50vw'
                  />
                  <PremiumWishlistButton
                    slug={product.slug}
                    productId={product._id !== product.slug ? product._id : undefined}
                    productName={product.name}
                    className='absolute top-2.5 right-2.5 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  />
                </div>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='font-serif text-xl tracking-wide'>
                      {product.name}
                    </h3>
                    <p className='mt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-account-on-surface-variant'>
                      {product.fabric}
                    </p>
                  </div>
                  <span className='shrink-0 text-base text-account-primary/80'>
                    {formatPrice(product.price)}
                  </span>
                </div>
              </Link>
            </PremiumFadeIn>
          ))}
        </div>
      </section>

      {/* Editorial feature */}
      <section className='bg-white px-5 py-12 md:px-16 md:py-16'>
        <div className='mx-auto flex max-w-[1280px] flex-col items-center gap-6 md:flex-row md:gap-12'>
          <PremiumFadeIn className='w-full md:w-7/12'>
            <div className='relative aspect-[4/5] overflow-hidden'>
              <Image
                src={PREMIUM_EDITORIAL_IMAGE}
                alt='Lifestyle Editorial'
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 58vw'
              />
            </div>
          </PremiumFadeIn>
          <PremiumFadeIn className='flex w-full flex-col justify-center md:w-5/12 md:pl-8'>
            <p className='mb-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-account-on-surface-variant'>
              The Rani Edit
            </p>
            <h2 className='font-serif text-[clamp(2rem,5vw,2.5rem)] font-semibold leading-tight'>
              CRAFTED FOR THE EXTRAORDINARY
            </h2>
            <p className='mt-8 text-lg font-light leading-relaxed text-account-on-surface-variant'>
              Every piece in the Premium Edit is a testament to time. It takes
              our master weavers over 200 hours to bring these designs to life.
              We embrace the perfect imperfections of handloom, creating
              garments that are not just worn, but inherited.
            </p>
            <Link
              href='#collection'
              className='group mt-10 flex w-fit items-center space-x-4 border-b border-account-primary pb-2 transition-colors duration-300 hover:border-brand-500'
            >
              <span className='text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors group-hover:text-brand-600'>
                View Collection
              </span>
              <span
                aria-hidden
                className='text-sm transition-transform group-hover:translate-x-1'
              >
                →
              </span>
            </Link>
          </PremiumFadeIn>
        </div>
      </section>

      {/* Story */}
      <section className='bg-account-primary px-5 py-12 text-center text-white md:px-16'>
        <PremiumFadeIn className='mx-auto max-w-4xl'>
          <h2 className='font-serif text-[clamp(2rem,6vw,3.5rem)] font-normal leading-tight text-brand-100'>
            MORE THAN A SAREE
          </h2>
          <p className='mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-brand-100/90'>
            The Premium Collection transcends fashion. It is an archive of
            technique, an homage to the hands that weave magic into threads.
            Each drape is a narrative of heritage, reimagined for the modern
            silhouette.
          </p>
          <div className='relative mt-8 aspect-[21/9] w-full overflow-hidden opacity-90'>
            <Image
              src={PREMIUM_CRAFT_IMAGE}
              alt='Craftsmanship'
              fill
              className='object-cover'
              sizes='(max-width: 1280px) 100vw, 1280px'
            />
          </div>
        </PremiumFadeIn>
      </section>

      {/* Final CTA */}
      <section className='flex min-h-[480px] flex-col items-center justify-center px-5 py-10 text-center md:px-16'>
        <PremiumFadeIn>
          <h2 className='mx-auto max-w-3xl font-serif text-[clamp(2rem,5vw,2.5rem)] font-semibold leading-tight'>
            DISCOVER THE RANI PREMIUM EDIT
          </h2>
          <p className='mx-auto mt-6 max-w-xl text-lg font-light text-account-on-surface-variant'>
            Exceptional pieces, thoughtfully curated for your legacy.
          </p>
          <Link
            href='#collection'
            className='mt-12 inline-block bg-account-primary px-10 py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-brand-600'
          >
            Explore Collection
          </Link>
        </PremiumFadeIn>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Instagram, Mail, Phone } from "lucide-react";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { BRAND_NAME } from "@/lib/brandSeo";
import type { AboutImage } from "@/components/about/aboutPageTypes";

const INSTAGRAM_URL = "https://www.instagram.com/houseofrani";
const INSTAGRAM_HANDLE = "@houseofrani";
const SUPPORT_EMAIL = "support@thehouseofrani.com";
const SUPPORT_PHONE = "+91 83403 11033";

type Props = {
  galleryImage?: AboutImage;
};

export default function AboutConnectSection({ galleryImage }: Props) {
  return (
    <section
      className="relative py-16 sm:py-24"
      aria-labelledby="about-connect-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f7] via-white to-[#faf9f7]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Instagram — warm card, not navy block */}
        <div
          data-about-reveal
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] ring-1 ring-stone-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(20,25,47,0.12)]"
        >
          <div className="grid lg:grid-cols-2">
            {galleryImage ? (
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[320px] overflow-hidden">
                <Image
                  src={galleryImage.src}
                  alt={galleryImage.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  loader={cloudinaryLoader}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white/20 via-transparent to-transparent lg:from-transparent"
                  aria-hidden
                />
              </div>
            ) : (
              <div
                className="hidden lg:block bg-gradient-to-br from-brand-50 to-stone-100 min-h-[280px]"
                aria-hidden
              />
            )}

            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600">
                Connect with us
              </p>
              <h2
                id="about-connect-heading"
                className="mt-3 font-serif text-2xl sm:text-4xl font-bold text-navy-900 leading-tight"
              >
                Share your beautiful drape
              </h2>
              <p className="mt-4 text-stone-600 text-sm sm:text-base leading-relaxed">
                Connect us at Instagram ({INSTAGRAM_HANDLE}) and share your
                beautiful drape with us. We love seeing how you wear{" "}
                {BRAND_NAME} — from festive gatherings to everyday elegance.
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-fit items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Instagram className="h-5 w-5" aria-hidden />
                Follow {INSTAGRAM_HANDLE}
              </a>
            </div>
          </div>
        </div>

        {/* Contact strip — cream, not blue */}
        <div
          data-about-reveal
          className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-[#faf9f7] p-6 sm:p-8"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="font-serif text-xl font-bold text-navy-900">
                We&apos;re here for you
              </p>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Questions about orders, drapes, or gifting? Reach out — our team
                at {BRAND_NAME} is happy to help.
              </p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="group flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-stone-100 hover:ring-brand-200 transition-all"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Email
                </span>
                <span className="mt-1 block text-sm font-semibold text-navy-900 group-hover:text-brand-600 break-all">
                  {SUPPORT_EMAIL}
                </span>
              </div>
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="group flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-stone-100 hover:ring-brand-200 transition-all"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Phone
                </span>
                <span className="mt-1 block text-sm font-semibold text-navy-900 group-hover:text-brand-600">
                  {SUPPORT_PHONE}
                </span>
              </div>
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-200/80 flex flex-wrap gap-4">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:gap-3 transition-all"
            >
              Visit FAQ <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-brand-600 transition-colors"
            >
              Continue shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

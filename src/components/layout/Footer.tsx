"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { categoryApi, storefrontApi } from "@/lib/api";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { Category, StorefrontSettings } from "@/types";
import { queryKeys } from "@/lib/queryKeys";

function normalizeHref(href: string): string {
  const raw = String(href || "").trim();
  if (!raw) return "/";
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  if (!raw.startsWith("/")) return `/${raw}`;
  try {
    const url = new URL(raw, "https://dummy.local");
    const normalized = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      normalized.append(key, value);
    });
    const qs = normalized.toString();
    return `${url.pathname}${qs ? `?${qs}` : ""}${url.hash || ""}`;
  } catch {
    return raw;
  }
}
/** Footer — same React Query cache as Navbar: full list, then filter non-gift for shop links. */
export default function Footer() {
  const router = useRouter();
  const { data: categoriesRaw = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const body = await categoryApi.getAll();
      return (body.data.categories || []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => categoriesRaw.filter(isShopCatalogCategory),
    [categoriesRaw],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      categories.slice(0, 8).forEach((cat) => {
        router.prefetch(buildShopCategoryHref(cat));
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [categories, router]);

  const { data: settings = null } = useQuery({
    queryKey: queryKeys.storefrontSettings,
    queryFn: async () => {
      const body = await storefrontApi.getSettings();
      return (body.data.settings ?? null) as StorefrontSettings | null;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const footer = settings?.footer;
  const quickLinks =
    footer?.quickLinks?.length ?
      footer.quickLinks
    : [
        { label: "Home", href: "/" },
        { label: "Shop Sarees", href: "/shop" },
        { label: "Gifting", href: "/gifting" },
        { label: "New Arrivals", href: "/shop?sort=-createdAt" },
        { label: "Featured", href: "/shop?isFeatured=true" },
        { label: "Returns", href: "/returns" },
        { label: "Cart", href: "/cart" },
      ];

  const bottomBarSection = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Return Policy", href: "/returns" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Shipping Policy", href: "/shipping" },
  ];
  const categoryLimit = footer?.categoryLimit || 7;
  const contactAddress = footer?.contactAddress || "Noida Sector 76, India";
  const contactPhone = footer?.contactPhone || "8340311033";
  const contactEmail = footer?.contactEmail || "support@thehouseofrani.com";
  const socialLinks = [
    { Icon: Facebook, href: footer?.facebookUrl || "", label: "Facebook" },
    { Icon: Instagram, href: footer?.instagramUrl || "", label: "Instagram" },
  ].filter((s) => {
    const href = normalizeHref(s.href);
    return href !== "/" && href !== "#";
  });

  return (
    <footer className='bg-navy-900 text-white/80'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
          {/* Brand column */}
          <div className='lg:col-span-1'>
            <Link href='/'>
              <Image
                src='/logo.png'
                alt='The House of Rani'
                width={160}
                height={50}
                className='h-14 w-auto object-contain mb-5'
              />
            </Link>
            <p className='text-sm leading-relaxed mb-5 text-white/85'>
              {footer?.description ||
                "Your destination for exquisite Indian ethnic wear. Curated collections of sarees, lehengas, and more — crafted with love and tradition. "}
            </p>
            <div className='flex space-x-2'>
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={normalizeHref(href)}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={label}
                  className='h-9 w-9 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center hover:bg-brand-700 hover:border-brand-600 transition-colors'
                >
                  <Icon className='h-4 w-4 text-white/85' />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className='text-white font-semibold mb-4 tracking-wide'>
              Quick Links
            </h3>
            <ul className='space-y-2 text-sm'>
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  {/^(https?:|mailto:|tel:)/i.test(href) ?
                    <a
                      href={normalizeHref(href)}
                      className='text-white/90 hover:text-brand-300 transition-colors'
                    >
                      {label}
                    </a>
                  : <Link
                      href={normalizeHref(href)}
                      className='text-white/90 hover:text-brand-300 transition-colors'
                    >
                      {label}
                    </Link>
                  }
                </li>
              ))}
            </ul>
          </div>
          {/* 
          Categories — dynamically show a few */}
          <div>
            <h3 className='text-white font-semibold mb-4 tracking-wide'>
              Categories
            </h3>
            <ul className='space-y-2 text-sm'>
              {categories.slice(0, categoryLimit).map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={buildShopCategoryHref(cat)}
                    className='text-white/90 hover:text-brand-300 transition-colors'
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + newsletter */}
          <div>
            <h3 className='text-white font-semibold mb-4 tracking-wide'>
              Contact Us
            </h3>
            <ul className='space-y-3 text-sm mb-6'>
              <li className='flex items-start gap-2'>
                <MapPin className='h-4 w-4 mt-0.5 text-brand-500 flex-shrink-0' />
                <span>{contactAddress}</span>
              </li>
              <li className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-brand-500 flex-shrink-0' />
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                  className='text-white/90 hover:text-brand-300 transition-colors'
                >
                  {contactPhone}
                </a>
              </li>
              <li className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-brand-500 flex-shrink-0' />
                <a
                  href={`mailto:${contactEmail}`}
                  className='text-white/90 hover:text-brand-300 transition-colors'
                >
                  {contactEmail}
                </a>
              </li>
            </ul>
            {/* 
            <h4 className='text-white text-sm font-semibold mb-2'>
              Newsletter
            </h4>
            <form className='flex gap-2' onSubmit={(e) => e.preventDefault()}>
              <input
                type='email'
                placeholder='Your email'
                className='flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-600 transition-colors'
              />
              <button
                type='submit'
                className='px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors'
              >
                Join
              </button>
            </form> */}
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-12 pt-6 border-t border-navy-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/70'>
          <p>
            © {new Date().getFullYear()} The House of Rani. All rights reserved.
          </p>
          <div className='flex flex-wrap justify-center gap-x-4 gap-y-2'>
            {bottomBarSection.map(({ label, href }) => (
              <Link
                key={label}
                href={normalizeHref(href)}
                className='text-white/85 hover:text-brand-300 transition-colors'
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

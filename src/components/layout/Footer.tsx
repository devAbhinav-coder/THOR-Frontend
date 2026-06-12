"use client";

import { useMemo, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Facebook,
  Instagram,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { categoryApi, storefrontApi } from "@/lib/api";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { Category, StorefrontSettings } from "@/types";
import { queryKeys } from "@/lib/queryKeys";
import { resolveFooterCuratorialLinks } from "@/lib/footerQuickLinks";
import FooterContactDialog from "@/components/layout/FooterContactDialog";
import { cn } from "@/lib/utils";
import {
  footerAccentLine,
  footerBottomLink,
  footerBrandDescription,
  footerBrandTitle,
  footerContainer,
  footerCopyright,
  footerLink,
  footerLinkList,
  footerMobileSectionButton,
  footerMobileSectionPanel,
  footerMobileSectionShell,
  footerSectionHeading,
  footerShell,
  footerSocialButton,
  footerTrustIcon,
  footerTrustItem,
  resolveFooterCategoryLimit,
} from "@/lib/footerStyles";

const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: "Authentic craftsmanship" },
  { Icon: Truck, label: "Pan-India delivery" },
  { Icon: RotateCcw, label: "7-day easy returns" },
] as const;

const POLICY_LINKS = [
  { label: "Shipping & Returns", href: "/shipping" },
  { label: "Return Policy", href: "/returns" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

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

function FooterNavLink({ href, label }: { href: string; label: string }) {
  const normalized = normalizeHref(href);
  const isExternal = /^(https?:|mailto:|tel:)/i.test(normalized);

  if (isExternal) {
    return (
      <a href={normalized} className={footerLink}>
        {label}
      </a>
    );
  }

  return (
    <Link href={normalized} className={footerLink}>
      {label}
    </Link>
  );
}

function FooterSection({
  title,
  children,
  className,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn(footerMobileSectionShell, className)}>
      <button
        type='button'
        className={footerMobileSectionButton}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <h3 className={footerSectionHeading}>{title}</h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/45 transition-transform duration-300 motion-reduce:transition-none lg:hidden",
            open && "rotate-180",
          )}
          aria-hidden='true'
        />
      </button>

      <div
        className={cn(
          footerMobileSectionPanel,
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] lg:grid-rows-[1fr]",
        )}
      >
        <div className='overflow-hidden lg:overflow-visible'>
          <div className='pb-5 pt-0 lg:pb-0 lg:pt-4'>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
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
  const curatorialLinks = resolveFooterCuratorialLinks(footer?.quickLinks);
  const categoryLimit = resolveFooterCategoryLimit(
    footer?.categoryLimit,
    categories.length,
  );
  const visibleCategories = categories.slice(0, categoryLimit);

  useEffect(() => {
    const id = window.setTimeout(() => {
      visibleCategories.forEach((cat) => {
        router.prefetch(buildShopCategoryHref(cat));
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [visibleCategories, router]);

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

  const hideOnMobilePaths = ["/cart", "/checkout", "/dashboard"];
  const shouldHideOnMobile = hideOnMobilePaths.some(p => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <footer className={cn(footerShell, shouldHideOnMobile && "max-lg:hidden")} role='contentinfo' aria-label='Site footer'>
      <div className={footerAccentLine} aria-hidden='true' />

      <div className={cn(footerContainer, "py-10 sm:py-14 lg:py-16")}>
        <div className='lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16'>
          {/* Brand — always visible */}
          <div className='mb-2 border-b border-navy-800/70 pb-8 lg:col-span-4 lg:mb-0 lg:border-0 lg:pb-0'>
            <div className='max-w-md'>
            <Link
              href='/'
              aria-label='The House of Rani — Home'
              className='inline-block'
            >
              <Image
                src='/logo.png'
                alt='The House of Rani'
                width={160}
                height={50}
                className='mb-4 h-11 w-auto object-contain sm:h-12'
              />
            </Link>
            <p className={footerBrandTitle}>The House of Rani</p>
            <p className={cn(footerBrandDescription, "mt-3 max-w-sm")}>
              {footer?.description ||
                "Your destination for exquisite Indian ethnic wear. Curated sarees, lehengas, and gifts — crafted with love and tradition."}
            </p>
            {socialLinks.length > 0 && (
              <div className='mt-5 flex flex-wrap gap-2.5'>
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={normalizeHref(href)}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={label}
                    className={footerSocialButton}
                  >
                    <Icon className='h-4 w-4' strokeWidth={1.75} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Link columns — accordion on mobile, open columns on desktop */}
        <div className='grid grid-cols-1 lg:col-span-8 lg:grid-cols-3 lg:gap-10 xl:gap-12'>
          <FooterSection title='The Collection' className='lg:col-span-1'>
            {visibleCategories.length > 0 ?
              <ul className={footerLinkList}>
                {visibleCategories.map((cat) => (
                  <li key={cat._id}>
                    <Link
                      href={buildShopCategoryHref(cat)}
                      className={footerLink}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            : <p className='text-[13px] text-white/40'>No categories yet.</p>}
          </FooterSection>

          <FooterSection title='Curatorial' className='lg:col-span-1'>
            <ul className={footerLinkList}>
              {curatorialLinks.map(({ label, href }) => (
                <li key={`${label}-${href}`}>
                  <FooterNavLink href={href} label={label} />
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title='Concierge' className='lg:col-span-1'>
            <ul className={footerLinkList}>
              <li>
                <button
                  type='button'
                  className={footerBottomLink}
                  onClick={() => setContactOpen(true)}
                  aria-haspopup='dialog'
                >
                  Contact us
                </button>
              </li>
              {POLICY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={normalizeHref(href)} className={footerBottomLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>
        </div>
        </div>

        {/* Trust strip */}
        <div className='mt-8 border-t border-navy-800/80 pt-7 sm:mt-10 sm:pt-8'>
          <ul className='flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-3'>
            {TRUST_SIGNALS.map(({ Icon, label }) => (
              <li key={label} className='flex items-center gap-2.5'>
                <span className={footerTrustIcon} aria-hidden='true'>
                  <Icon className='h-3.5 w-3.5' strokeWidth={1.75} />
                </span>
                <span className={footerTrustItem}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright only — policies live under Concierge */}
        <div className='mt-7 border-t border-navy-800/80 pt-5 sm:mt-8'>
          <p className={cn(footerCopyright, "text-center lg:text-left")}>
            © {new Date().getFullYear()} The House of Rani. All rights reserved.
          </p>
        </div>
      </div>

      <FooterContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        address={contactAddress}
        phone={contactPhone}
        email={contactEmail}
      />
    </footer>
  );
}

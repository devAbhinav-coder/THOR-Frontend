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
import { navigationApi, storefrontApi } from "@/lib/api";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { MegaMenuCategory, StorefrontSettings } from "@/types";
import { queryKeys } from "@/lib/queryKeys";
import { resolveFooterCuratorialLinks } from "@/lib/footerQuickLinks";
import FooterContactDialog from "@/components/layout/FooterContactDialog";
import { requestOpenRaniCare } from "@/components/support/rani-care/chatStorage";
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

/** Official-style WhatsApp glyph — lucide has no brand mark. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      className={className}
    >
      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
    </svg>
  );
}

/** Build wa.me link from storefront phone (Indian 10-digit → +91). */
function buildWhatsAppHref(phone: string): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  let e164 = digits;
  if (digits.length === 10) e164 = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0"))
    e164 = `91${digits.slice(1)}`;
  else if (digits.length < 10) return null;
  return `https://wa.me/${e164}`;
}
const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: "Authentic craftsmanship" },
  { Icon: Truck, label: "Pan-India delivery" },
  { Icon: RotateCcw, label: "5-day easy returns" },
] as const;

const POLICY_LINKS = [
  { label: "Shipping & Returns", href: "/shipping" },
  { label: "Return Policy", href: "/returns" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

/** Shown if API/SSR categories are unavailable so The Collection never looks empty. */
const FALLBACK_COLLECTION_LINKS = [
  { name: "All collections", href: "/shop/collections" },
  { name: "Sarees", href: "/shop/collections/sarees" },
  { name: "Salwar suits", href: "/shop/collections/salwar-suits" },
  { name: "Lehengas", href: "/shop/collections/lehengas" },
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

type Props = {
  /** Same SSR mega-menu snapshot as Navbar — keeps The Collection populated on first paint. */
  initialNavCategories?: MegaMenuCategory[];
};

export default function Footer({ initialNavCategories = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.megaMenu,
    queryFn: async () => {
      const body = await navigationApi.getMegaMenu();
      return (body.data.categories || []) as unknown as MegaMenuCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const pickShopCategories = (cats: MegaMenuCategory[]) =>
      cats.filter(isShopCatalogCategory);
    const live = categoriesData ?? [];
    if (live.length > 0) return pickShopCategories(live);
    return pickShopCategories(initialNavCategories);
  }, [categoriesData, initialNavCategories]);

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

  const collectionLinks = useMemo(() => {
    if (visibleCategories.length > 0) {
      return visibleCategories.map((cat) => ({
        key: cat._id || cat.slug,
        name: cat.name,
        href: buildShopCategoryHref(cat),
      }));
    }
    return FALLBACK_COLLECTION_LINKS.map((link) => ({
      key: link.href,
      name: link.name,
      href: link.href,
    }));
  }, [visibleCategories]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      collectionLinks.forEach((link) => {
        router.prefetch(link.href);
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [collectionLinks, router]);

  const contactAddress = footer?.contactAddress || "Noida Sector 76, India";
  const contactPhone = footer?.contactPhone || "8340311033";
  const contactEmail = footer?.contactEmail || "support@thehouseofrani.com";
  const whatsappHref = buildWhatsAppHref(contactPhone);
  const socialLinks = [
    { Icon: Facebook, href: footer?.facebookUrl || "", label: "Facebook" },
    { Icon: Instagram, href: footer?.instagramUrl || "", label: "Instagram" },
    ...(whatsappHref ?
      [{ Icon: WhatsAppIcon, href: whatsappHref, label: "WhatsApp" }]
    : []),
  ].filter((s) => {
    const href = normalizeHref(s.href);
    return href !== "/" && href !== "#";
  });

  const hideOnMobilePaths = ["/cart", "/checkout", "/dashboard"];
  const shouldHideOnMobile = hideOnMobilePaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const hideCompletelyPaths = ["/shop"];
  const shouldHideCompletely = hideCompletelyPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (shouldHideCompletely) return null;

  return (
    <footer
      className={cn(footerShell, shouldHideOnMobile && "max-lg:hidden")}
      role='contentinfo'
      aria-label='Site footer'
    >
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
              <ul className={footerLinkList}>
                {collectionLinks.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className={footerLink}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
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
                    onClick={() => requestOpenRaniCare()}
                  >
                    Rani Care
                  </button>
                </li>
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
                    <Link
                      href={normalizeHref(href)}
                      className={footerBottomLink}
                    >
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
        whatsappHref={whatsappHref || undefined}
      />
    </footer>
  );
}

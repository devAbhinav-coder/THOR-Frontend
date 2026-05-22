import type {
  AboutImage,
  AboutInternalLink,
  AboutProductTeaser,
} from "@/components/about/aboutPageTypes";
import type { HeroSlide, Category, Product } from "@/types";
import { fallbackHeroSlides } from "@/lib/heroSlidesFallback";
import { fetchStorefrontHeroSlides } from "@/lib/storefrontServer";
import {
  fetchHomeCategoryStats,
  fetchHomeFeaturedProducts,
} from "@/lib/storePrefetch";
import { BRAND_NAME } from "@/lib/brandSeo";
import { getSiteUrl } from "@/lib/siteUrl";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { isShopCatalogCategory } from "@/lib/categoryFilters";

import whyChooseUsImg from "@/assets/why-choose-us.png";

function productImageAlt(product: Product): string {
  const name = product.name?.trim() || "saree";
  return `${name} — story-led ethnic saree at ${BRAND_NAME}`;
}

async function resolveAboutPageImages(
  featured: Product[] | null,
): Promise<AboutImage[]> {
  const heroSlides = await fetchStorefrontHeroSlides();
  const slides = (heroSlides?.length ? heroSlides : fallbackHeroSlides).filter(
    (s: HeroSlide) => Boolean(s?.image),
  );

  const out: AboutImage[] = [];
  const seen = new Set<string>();

  const push = (src: string, alt: string, caption?: string) => {
    const key = src.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ src: key, alt, caption });
  };

  slides.slice(0, 4).forEach((slide) => {
    const title = slide.title?.trim() || "ethnic saree collection";
    push(
      slide.image as string,
      `${title} — ${BRAND_NAME} handcrafted sarees`,
      slide.subtitle?.trim(),
    );
  });

  (featured || []).slice(0, 3).forEach((p) => {
    const url = p.images?.[0]?.url;
    if (url) push(url, productImageAlt(p));
  });

  push(
    whyChooseUsImg.src,
    `${BRAND_NAME} — premium Indian ethnic wear`,
  );

  const ogFallback = `${getSiteUrl()}/ogimage.png`;
  if (out.length < 2) push(ogFallback, `${BRAND_NAME} — About us`);

  return out.slice(0, 8);
}

function toProductTeasers(products: Product[] | null): AboutProductTeaser[] {
  return (products || [])
    .filter((p) => p?.slug && p.images?.[0]?.url)
    .slice(0, 4)
    .map((p) => ({
      slug: p.slug as string,
      name: p.name || "Saree",
      image: p.images![0].url as string,
      href: `/shop/${encodeURIComponent(p.slug as string)}`,
    }));
}

function buildStaticInternalLinks(): AboutInternalLink[] {
  return [
    {
      href: "/shop",
      label: "Shop all sarees",
      description: "Browse premium ethnic wear and story-led sarees online.",
      group: "shop",
    },
    {
      href: "/shop?sort=newest",
      label: "New arrivals",
      description: "Latest drops — modern drapes with heritage motifs.",
      group: "shop",
    },
    {
      href: "/gifting",
      label: "Gifting & hampers",
      description: "Curated celebration gifts and customizable hampers.",
      group: "shop",
    },
    {
      href: "/blog",
      label: "Journal & styling",
      description: "Drape guides, festive looks, and saree styling tips.",
      group: "discover",
    },
    {
      href: "/faq",
      label: "FAQ",
      description: "Orders, sizing, shipping timelines, and returns.",
      group: "help",
    },
    {
      href: "/shipping",
      label: "Shipping policy",
      description: "Pan-India delivery, processing times, and tracking.",
      group: "help",
    },
    {
      href: "/returns",
      label: "Returns & exchanges",
      description: "7-day hassle-free returns explained clearly.",
      group: "help",
    },
    {
      href: "/terms",
      label: "Terms of service",
      description: "Shopping terms, payments, and order policies.",
      group: "help",
    },
    {
      href: "/privacy",
      label: "Privacy policy",
      description: "How we protect your data and communication preferences.",
      group: "help",
    },
    {
      href: "/",
      label: "Home",
      description: "Return to The House of Rani storefront.",
      group: "brand",
    },
  ];
}

function buildCategoryLinks(
  categories: (Category & { productCount?: number })[],
): AboutInternalLink[] {
  return categories
    .filter(isShopCatalogCategory)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 5)
    .map((c) => ({
      href: buildShopCategoryHref(c),
      label: c.name || "Collection",
      description: `Shop ${c.name || "ethnic wear"} at ${BRAND_NAME}.`,
      group: "shop" as const,
    }));
}

export type AboutPageData = {
  images: AboutImage[];
  products: AboutProductTeaser[];
  internalLinks: AboutInternalLink[];
  categories: Pick<Category, "name" | "slug">[];
};

export async function resolveAboutPageData(): Promise<AboutPageData> {
  const [featured, categoryStats] = await Promise.all([
    fetchHomeFeaturedProducts(),
    fetchHomeCategoryStats(),
  ]);

  const categories = (categoryStats || []).filter(isShopCatalogCategory).slice(0, 8);

  const images = await resolveAboutPageImages(featured);
  const products = toProductTeasers(featured);
  const internalLinks = [
    ...buildStaticInternalLinks(),
    ...buildCategoryLinks(categories as Category[]),
  ];

  return {
    images,
    products,
    internalLinks,
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
    })),
  };
}

/** Flat link list for JSON-LD ItemList (crawl hints). */
export function aboutLinksForSchema(
  links: AboutInternalLink[],
  appUrl: string,
): { name: string; url: string }[] {
  const seen = new Set<string>();
  return links
    .filter((l) => {
      if (seen.has(l.href)) return false;
      seen.add(l.href);
      return true;
    })
    .map((l) => ({
      name: l.label,
      url: l.href.startsWith("http") ? l.href : `${appUrl}${l.href}`,
    }));
}

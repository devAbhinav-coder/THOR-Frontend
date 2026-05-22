import type {
  AboutImage,
  AboutInternalLink,
  AboutPageVisuals,
  AboutProductTeaser,
  AboutVisualImage,
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
  return `${name} — shop at ${BRAND_NAME}`;
}

function toProductVisual(p: Product): AboutVisualImage | null {
  const url =
    typeof p.images?.[0]?.url === "string" ? p.images[0].url.trim() : "";
  const slug = typeof p.slug === "string" ? p.slug.trim() : "";
  if (!url || !slug) return null;
  return {
    src: url,
    alt: productImageAlt(p),
    caption: p.name?.trim(),
    href: `/shop/${encodeURIComponent(slug)}`,
  };
}

function pickProductVisuals(featured: Product[] | null): AboutVisualImage[] {
  const out: AboutVisualImage[] = [];
  const seen = new Set<string>();
  for (const p of featured || []) {
    const v = toProductVisual(p);
    if (!v || seen.has(v.src)) continue;
    seen.add(v.src);
    out.push(v);
  }
  return out;
}

function toVisual(img: AboutImage | null | undefined): AboutVisualImage | null {
  const src = typeof img?.src === "string" ? img.src.trim() : "";
  if (!src) return null;
  return {
    src,
    alt: img?.alt || `${BRAND_NAME} — handcrafted sarees`,
    caption: img?.caption,
  };
}

function attachProductHref(
  visual: AboutVisualImage | null,
  featured: Product[] | null,
): AboutVisualImage | null {
  if (!visual) return null;
  const match = (featured || []).find((p) => {
    const url =
      typeof p.images?.[0]?.url === "string" ? p.images[0].url.trim() : "";
    const slug = typeof p.slug === "string" ? p.slug.trim() : "";
    return url && slug && url === visual.src;
  });
  if (!match) return visual;
  const linked = toProductVisual(match);
  return linked ? { ...visual, href: linked.href, caption: linked.caption ?? visual.caption } : visual;
}

/** Same ordered list as before: hero slides → featured → brand fallbacks. */
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
    if (typeof url === "string" && url.trim()) {
      push(url.trim(), productImageAlt(p));
    }
  });

  push(
    whyChooseUsImg.src,
    `${BRAND_NAME} — premium Indian ethnic wear`,
  );

  const ogFallback = `${getSiteUrl()}/ogimage.png`;
  if (out.length < 2) push(ogFallback, `${BRAND_NAME} — About us`);

  return out.slice(0, 8);
}

function pickFeaturedForSection(
  products: AboutVisualImage[],
  heroSlideSrcs: Set<string>,
  usedSrcs: Set<string>,
  fallbackIndex: number,
): AboutVisualImage | null {
  const candidate =
    products.find(
      (p) => !heroSlideSrcs.has(p.src) && !usedSrcs.has(p.src),
    ) ??
    products.find((p) => !heroSlideSrcs.has(p.src)) ??
    products[fallbackIndex] ??
    products[0] ??
    null;
  if (candidate) usedSrcs.add(candidate.src);
  return candidate;
}

/**
 * Section mapping:
 * - hero → images[0] (hero slide 1)
 * - dreamBanner → images[1] (hero slide 2)
 * - bento → images[0..4] (hero slides + featured in list)
 * - intention → featured saree (NOT hero slide 3)
 * - connect → featured saree (NOT hero slide 4)
 */
async function resolveAboutVisualsAsync(
  featured: Product[] | null,
): Promise<AboutPageVisuals> {
  const images = await resolveAboutPageImages(featured);
  const products = pickProductVisuals(featured);
  const heroSlideSrcs = new Set(images.slice(0, 4).map((i) => i.src));
  const usedProductSrcs = new Set<string>();

  const hero = images[0] ?? null;
  const dreamBanner = toVisual(images[1]);
  const bento = images
    .slice(0, 5)
    .map((img) => attachProductHref(toVisual(img), featured))
    .filter((v): v is AboutVisualImage => Boolean(v));

  const intention =
    pickFeaturedForSection(products, heroSlideSrcs, usedProductSrcs, 0) ??
    attachProductHref(toVisual(images[4]), featured) ??
    attachProductHref(toVisual(images[5]), featured) ?? {
      src: whyChooseUsImg.src,
      alt: `${BRAND_NAME} — premium Indian ethnic wear`,
      href: "/shop",
    };

  const connect =
    pickFeaturedForSection(products, heroSlideSrcs, usedProductSrcs, 1) ??
    pickFeaturedForSection(products, heroSlideSrcs, new Set(), 0) ?? {
      src: whyChooseUsImg.src,
      alt: `${BRAND_NAME} — premium Indian ethnic wear`,
      href: "/shop",
    };

  return {
    hero,
    dreamBanner,
    bento,
    intention,
    connect,
  };
}

/** Unique images for JSON-LD */
export function collectAboutSchemaImages(visuals: AboutPageVisuals): AboutImage[] {
  const out: AboutImage[] = [];
  const seen = new Set<string>();
  const push = (img: AboutImage | null | undefined) => {
    if (!img?.src || seen.has(img.src)) return;
    seen.add(img.src);
    out.push({ src: img.src, alt: img.alt, caption: img.caption });
  };
  push(visuals.hero);
  push(visuals.dreamBanner);
  visuals.bento.forEach(push);
  push(visuals.intention);
  push(visuals.connect);
  return out;
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
  visuals: AboutPageVisuals;
  schemaImages: AboutImage[];
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
  const visuals = await resolveAboutVisualsAsync(featured);
  const products = toProductTeasers(featured);
  const internalLinks = [
    ...buildStaticInternalLinks(),
    ...buildCategoryLinks(categories as Category[]),
  ];

  return {
    visuals,
    schemaImages: collectAboutSchemaImages(visuals),
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

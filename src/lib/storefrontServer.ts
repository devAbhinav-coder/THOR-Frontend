import { cache } from "react";
import type {
  Blog,
  Category,
  HeroSlide,
  Product,
  StorefrontSettings,
  Testimonial,
} from "@/types";
import { STOREFRONT_SETTINGS_CACHE_TAG } from "@/lib/cacheTags";
import { fallbackHeroSlides } from "@/lib/heroSlidesFallback";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { serverFetch } from "@/lib/serverFetch";

type StorefrontSettingsJson = {
  data?: { settings?: StorefrontSettings };
};

/** One network call per SSR request - shared by hero + home sections. */
const fetchStorefrontSettingsCached = cache(
  async (): Promise<StorefrontSettings | null> => {
    const base = await getBuildSafeApiBase();
    if (!base) return null;
    try {
      const res = await serverFetch(`${base}/storefront/settings`, {
        next: { revalidate: 120, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as StorefrontSettingsJson;
      const settings = json?.data?.settings;
      return settings && typeof settings === "object" ? settings : null;
    } catch {
      return null;
    }
  },
);

/**
 * Server-only fetch for hero slides so the LCP image is in the HTML immediately
 * (avoids waiting on client JS + /storefront/settings before paint).
 */
export async function fetchStorefrontHeroSlides(): Promise<HeroSlide[]> {
  const settings = await fetchStorefrontSettingsCached();
  if (!settings) return fallbackHeroSlides;

  const incoming = settings.heroSlides;
  if (!Array.isArray(incoming)) return fallbackHeroSlides;

  const active = incoming.filter(
    (s) => s && s.isActive !== false && s.image && s.title,
  ) as HeroSlide[];
  return active.length > 0 ? active : fallbackHeroSlides;
}

/**
 * Full storefront settings for the home page so promo / gift sections render
 * with real height + content during SSR - eliminates the late-mount CLS that
 * happens when these client components fetch on hydration.
 */
export async function fetchStorefrontSettingsHome(): Promise<StorefrontSettings | null> {
  return fetchStorefrontSettingsCached();
}

export type StorefrontHomePageBundle = {
  heroSlides: HeroSlide[];
  settings: StorefrontSettings | null;
  categoryStats: (Category & { productCount: number })[] | null;
  sareeSubcategories: Category[] | null;
  featuredProducts: Product[] | null;
  latestBlogs: Blog[] | null;
  testimonials: Testimonial[] | null;
  exploreProducts: Product[] | null;
};

type HomeBundleApiJson = {
  data?: {
    settings?: StorefrontSettings;
    heroSlides?: HeroSlide[];
    categoryStats?: (Category & { productCount: number })[];
    sareeSubcategories?: Category[];
    featuredProducts?: Product[];
    latestBlogs?: Blog[];
    testimonials?: Testimonial[];
    exploreProducts?: Product[];
  };
};

function normalizeHomeBundle(
  raw: NonNullable<HomeBundleApiJson["data"]>,
): StorefrontHomePageBundle {
  const settings =
    raw.settings && typeof raw.settings === "object" ? raw.settings : null;
  const heroFromApi = Array.isArray(raw.heroSlides) ? raw.heroSlides : [];
  const heroSlides =
    heroFromApi.length > 0 ? heroFromApi
    : settings ?
      (settings.heroSlides ?? []).filter(
        (s) => s && s.isActive !== false && s.image && s.title,
      )
    : fallbackHeroSlides;

  const settingsClean =
    settings ?
      (() => {
        const {
          giftingHeroBanners: _a,
          giftingSecondaryBanners: _b,
          homeGiftShowcase: _c,
          ...rest
        } = settings;
        return rest as StorefrontSettings;
      })()
    : null;

  return {
    heroSlides: heroSlides.length > 0 ? heroSlides : fallbackHeroSlides,
    settings: settingsClean,
    categoryStats: Array.isArray(raw.categoryStats) ? raw.categoryStats : null,
    sareeSubcategories:
      Array.isArray(raw.sareeSubcategories) ? raw.sareeSubcategories : null,
    featuredProducts:
      Array.isArray(raw.featuredProducts) ? raw.featuredProducts : null,
    latestBlogs:
      Array.isArray(raw.latestBlogs) ?
        raw.latestBlogs.filter(
          (b) => b?.slug && b?.title && b.isPublished !== false,
        )
      : null,
    testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : null,
    exploreProducts:
      Array.isArray(raw.exploreProducts) ? raw.exploreProducts : null,
  };
}

/** One API round-trip for `/` SSR - replaces 7 parallel home fetches. */
export const fetchStorefrontHomePageBundle = cache(
  async (): Promise<StorefrontHomePageBundle | null> => {
    const base = await getBuildSafeApiBase();
    if (!base) return null;
    try {
      const res = await serverFetch(`${base}/storefront/home`, {
        next: { revalidate: 60, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as HomeBundleApiJson;
      if (!json?.data || typeof json.data !== "object") return null;
      return normalizeHomeBundle(json.data);
    } catch {
      return null;
    }
  },
);

/** @deprecated Prefer `fetchStorefrontHomePageBundle` - settings + hero only. */
export async function fetchStorefrontHomeBundle(): Promise<{
  heroSlides: HeroSlide[];
  settings: StorefrontSettings | null;
}> {
  const bundle = await fetchStorefrontHomePageBundle();
  if (bundle) {
    return { heroSlides: bundle.heroSlides, settings: bundle.settings };
  }
  const settings = await fetchStorefrontSettingsCached();
  if (!settings) {
    return { heroSlides: fallbackHeroSlides, settings: null };
  }
  const incoming = settings.heroSlides;
  const active =
    Array.isArray(incoming) ?
      (incoming.filter(
        (s) => s && s.isActive !== false && s.image && s.title,
      ) as HeroSlide[])
    : [];
  return {
    heroSlides: active.length > 0 ? active : fallbackHeroSlides,
    settings,
  };
}

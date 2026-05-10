import type { HeroSlide, StorefrontSettings } from "@/types";
import { STOREFRONT_SETTINGS_CACHE_TAG } from "@/lib/cacheTags";
import { fallbackHeroSlides } from "@/lib/heroSlidesFallback";
import * as schemas from "@/lib/api-schemas";
import { parseApiResponse } from "@/lib/parseApi";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

/**
 * Server-only fetch for hero slides so the LCP image is in the HTML immediately
 * (avoids waiting on client JS + /storefront/settings before paint).
 */
export async function fetchStorefrontHeroSlides(): Promise<HeroSlide[]> {
  const base = await getBuildSafeApiBase();
  if (!base) return fallbackHeroSlides;

  try {
    const res = await fetch(`${base}/storefront/settings`, {
      next: { revalidate: 120, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallbackHeroSlides;

    const json = (await res.json()) as {
      data?: { settings?: { heroSlides?: HeroSlide[] } };
    };
    const incoming = json?.data?.settings?.heroSlides;
    if (!Array.isArray(incoming)) return fallbackHeroSlides;

    const active = incoming.filter(
      (s) => s && s.isActive !== false && s.image && s.title,
    ) as HeroSlide[];
    return active.length > 0 ? active : fallbackHeroSlides;
  } catch {
    return fallbackHeroSlides;
  }
}

/**
 * Full storefront settings for the home page so promo / gift sections render
 * with real height + content during SSR — eliminates the late-mount CLS that
 * happens when these client components fetch on hydration.
 */
export async function fetchStorefrontSettingsHome(): Promise<StorefrontSettings | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/storefront/settings`, {
      next: { revalidate: 120, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { settings?: StorefrontSettings };
    };
    const settings = json?.data?.settings;
    return settings && typeof settings === "object" ? settings : null;
  } catch {
    return null;
  }
}

/**
 * Full storefront payload for /gifting — hydrates React Query on the server so the
 * hero LCP image is not blocked on a second client-only /storefront/settings round-trip.
 */
export async function fetchStorefrontSettingsGifting(): Promise<schemas.StorefrontSettingsApiEnvelope | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/storefront/settings`, {
      next: { revalidate: 120, tags: [STOREFRONT_SETTINGS_CACHE_TAG] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return parseApiResponse(
      "storefront.settings.gifting.ssr",
      json,
      schemas.storefrontSettings,
    );
  } catch {
    return null;
  }
}

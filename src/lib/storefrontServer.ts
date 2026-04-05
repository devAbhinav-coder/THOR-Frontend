import type { HeroSlide } from "@/types";
import { fallbackHeroSlides } from "@/lib/heroSlidesFallback";
import * as schemas from "@/lib/api-schemas";
import { parseApiResponse } from "@/lib/parseApi";

function apiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/**
 * Server-only fetch for hero slides so the LCP image is in the HTML immediately
 * (avoids waiting on client JS + /storefront/settings before paint).
 */
export async function fetchStorefrontHeroSlides(): Promise<HeroSlide[]> {
  const base = apiBase();
  if (!base) return fallbackHeroSlides;

  try {
    const res = await fetch(`${base}/storefront/settings`, {
      next: { revalidate: 120 },
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
 * Full storefront payload for /gifting — hydrates React Query on the server so the
 * hero LCP image is not blocked on a second client-only /storefront/settings round-trip.
 */
export async function fetchStorefrontSettingsGifting(): Promise<
  schemas.StorefrontSettingsApiEnvelope | null
> {
  const base = apiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/storefront/settings`, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return parseApiResponse("storefront.settings.gifting.ssr", json, schemas.storefrontSettings);
  } catch {
    return null;
  }
}

import { BRAND_SAME_AS } from "@/lib/brandSeo";

/** Footer social URL fields managed in Admin → Storefront → Footer. */
export type FooterSocialFields = {
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  pinterestUrl?: string;
};

export function isUsableSocialHref(
  href: string | undefined | null,
): href is string {
  const raw = String(href ?? "").trim();
  if (!raw || raw === "#" || raw === "/") return false;
  return true;
}

function sameAsDedupeKey(url: string): string {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "") || "";
    return `${host}${path}${u.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
}

/** Public profile URLs from storefront footer settings (valid URLs only). */
export function collectFooterSocialUrls(
  footer?: FooterSocialFields | null,
): string[] {
  if (!footer) return [];
  const candidates = [
    footer.instagramUrl,
    footer.facebookUrl,
    footer.pinterestUrl,
    footer.youtubeUrl,
    footer.twitterUrl,
  ];
  return candidates.filter(isUsableSocialHref);
}

/**
 * Organization / LocalBusiness `sameAs`: admin-configured profiles plus static
 * fallbacks from brandSeo (deduped).
 */
export function resolveBrandSameAs(
  footer?: FooterSocialFields | null,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...collectFooterSocialUrls(footer), ...BRAND_SAME_AS]) {
    const key = sameAsDedupeKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url.trim());
  }
  return out;
}

export type FooterSocialLinkSpec = {
  key: "facebook" | "instagram" | "pinterest" | "twitter" | "youtube";
  href: string;
  label: string;
};

/** Ordered social icons for the site footer (excludes WhatsApp — uses phone). */
export function listFooterSocialLinks(
  footer?: FooterSocialFields | null,
): FooterSocialLinkSpec[] {
  const entries: FooterSocialLinkSpec[] = [
    {
      key: "facebook",
      label: "Facebook",
      href: footer?.facebookUrl ?? "",
    },
    {
      key: "instagram",
      label: "Instagram",
      href: footer?.instagramUrl ?? "",
    },
    {
      key: "pinterest",
      label: "Pinterest",
      href: footer?.pinterestUrl ?? "",
    },
    {
      key: "youtube",
      label: "YouTube",
      href: footer?.youtubeUrl ?? "",
    },
    {
      key: "twitter",
      label: "X (Twitter)",
      href: footer?.twitterUrl ?? "",
    },
  ];
  return entries.filter((e) => isUsableSocialHref(e.href));
}

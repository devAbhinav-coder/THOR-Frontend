import type { Metadata } from "next";
import type { MarketingEdition, Product } from "@/types";
import { getSiteUrl } from "@/lib/siteUrl";
import { resolveSerpTitleString } from "@/lib/pageSeo";
import { SHOP_KEYWORDS } from "@/lib/brandSeo";
import {
  isMarketingEditionIndexable,
  isMarketingEditionLive,
  listLiveMarketingEditions,
  marketingEditionPath,
  normalizeMarketingEditionSlug,
} from "@/lib/marketingEditions";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";
import { STOREFRONT_SETTINGS_CACHE_TAG } from "@/lib/cacheTags";

const SITE_URL = getSiteUrl();

function clipMeta(text: string, max = 155): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function parseEditionSlugFromShopPath(pathname: string): string | null {
  const m = /^\/shop\/edits\/([^/?#]+)/i.exec(String(pathname || "").trim());
  if (!m?.[1]) return null;
  try {
    const slug = normalizeMarketingEditionSlug(decodeURIComponent(m[1]));
    return slug || null;
  } catch {
    return normalizeMarketingEditionSlug(m[1]) || null;
  }
}

/** True when URL is only `?edition=` / `?editions=` (legacy) with no other filters. */
export function parseEditionOnlySearchParams(
  sp: Record<string, string | string[] | undefined>,
): string | null {
  const keys = Object.keys(sp).filter((k) => {
    const v = sp[k];
    if (v === undefined) return false;
    if (typeof v === "string") return Boolean(v.trim());
    return Array.isArray(v) && v.length > 0;
  });
  const allowed = new Set(["edition", "editions"]);
  if (!keys.every((k) => allowed.has(k))) return null;
  const raw =
    (typeof sp.edition === "string" ? sp.edition : "") ||
    (typeof sp.editions === "string" ? sp.editions : "");
  const first = raw.split(",").map((s) => s.trim()).filter(Boolean)[0];
  return first ? normalizeMarketingEditionSlug(first) : null;
}

export async function fetchLiveMarketingEditionsForSeo(): Promise<
  MarketingEdition[]
> {
  const settings = await fetchStorefrontSettingsHome();
  return listLiveMarketingEditions(settings?.marketingEditions ?? []);
}

export function findMarketingEditionBySlug(
  editions: MarketingEdition[],
  slug: string,
): MarketingEdition | null {
  const key = normalizeMarketingEditionSlug(slug);
  if (!key) return null;
  return editions.find((e) => e.slug === key) ?? null;
}

export function resolveMarketingEditionSeoCopy(edition: MarketingEdition): {
  title: string;
  description: string;
  keywords: string[];
} {
  const name = edition.filterLabel || edition.label;
  const title =
    edition.seoTitle?.trim() ||
    `${name} - Festive Ethnic Wear Online India | The House of Rani`;
  const description =
    edition.seoDescription?.trim() ||
    clipMeta(
      `Shop the ${name} at The House of Rani — curated sarees, salwar suits & corsets for celebrations across India. Free delivery over ₹1,099 · easy 5-day returns · secure checkout.`,
    );
  const keywords = [
    ...SHOP_KEYWORDS.slice(0, 6),
    name,
    edition.label,
    edition.slug.replace(/-/g, " "),
    "festive wear India",
    "ethnic wear online India",
  ];
  return { title, description, keywords };
}

export function buildMarketingEditionMetadata(
  edition: MarketingEdition,
  options?: { index?: boolean },
): Metadata {
  const { title, description, keywords } =
    resolveMarketingEditionSeoCopy(edition);
  const path = marketingEditionPath(edition.slug);
  const index =
    options?.index ??
    (isMarketingEditionLive(edition) && isMarketingEditionIndexable(edition));
  const ogImage =
    edition.exploreImage?.trim() || `${SITE_URL}/ogimage.png`;
  const serpTitle = resolveSerpTitleString(title, title);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: serpTitle,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${edition.label} | The House of Rani`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: serpTitle,
      description,
      images: [ogImage],
    },
  };
}

export function buildMarketingEditionCollectionJsonLd(options: {
  edition: MarketingEdition;
  products: Product[];
}): object {
  const { edition, products } = options;
  const path = marketingEditionPath(edition.slug);
  const { title, description } = resolveMarketingEditionSeoCopy(edition);
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${path}#collectionpage`,
        name: title,
        description,
        url: `${SITE_URL}${path}`,
        inLanguage: "en-IN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "Thing",
          name: edition.label,
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Shop",
              item: `${SITE_URL}/shop/collections`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: edition.filterLabel || edition.label,
              item: `${SITE_URL}${path}`,
            },
          ],
        },
      },
      ...(products.length > 0 ?
        [
          {
            "@type": "ItemList",
            "@id": `${SITE_URL}${path}#itemlist`,
            name: `${edition.label} - The House of Rani`,
            url: `${SITE_URL}${path}`,
            numberOfItems: products.length,
            itemListElement: products
              .filter((p) => p?.slug && p?.name)
              .map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Product",
                  name: p.name,
                  url: `${SITE_URL}/shop/${encodeURIComponent(p.slug)}`,
                  image: p.images?.[0]?.url ?
                    [p.images[0].url]
                  : [`${SITE_URL}/ogimage.png`],
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "INR",
                    price: Number(p.price || 0).toFixed(2),
                    priceValidUntil,
                    availability:
                      p.totalStock > 0 ?
                        "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                    areaServed: { "@type": "Country", name: "India" },
                  },
                },
              })),
          },
        ]
      : []),
    ],
  };
}

/** Sitemap entries for indexable live marketing editions (ISR via storefront tag). */
export async function fetchSitemapMarketingEditionUrls(): Promise<
  Array<{ path: string; lastModified?: Date }>
> {
  const settings = await fetchStorefrontSettingsHome();
  const live = listLiveMarketingEditions(settings?.marketingEditions ?? []);
  return live
    .filter(isMarketingEditionIndexable)
    .map((e) => ({
      path: marketingEditionPath(e.slug),
      lastModified: settings?.updatedAt ?
        new Date(settings.updatedAt)
      : undefined,
    }));
}

export { STOREFRONT_SETTINGS_CACHE_TAG };

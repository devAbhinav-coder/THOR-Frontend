import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import type { Product } from "@/types";
import {
  buildMarketingEditionCollectionJsonLd,
  buildMarketingEditionMetadata,
  fetchLiveMarketingEditionsForSeo,
  findMarketingEditionBySlug,
} from "@/lib/marketingEditionSeo";
import {
  isMarketingEditionLive,
  normalizeMarketingEditionSlug,
} from "@/lib/marketingEditions";
import { STOREFRONT_SETTINGS_CACHE_TAG } from "@/lib/cacheTags";

type Params = Promise<{ slug: string }>;

async function fetchEditionProducts(slug: string): Promise<Product[]> {
  const base = await getBuildSafeApiBase();
  if (!base) return [];
  try {
    const res = await fetch(
      `${base}/products?edition=${encodeURIComponent(slug)}&limit=12&page=1&sort=-createdAt`,
      {
        next: {
          revalidate: 300,
          tags: [STOREFRONT_SETTINGS_CACHE_TAG, "catalog-products"],
        },
      },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { products?: Product[] } };
    return Array.isArray(json?.data?.products) ? json.data!.products! : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = normalizeMarketingEditionSlug(decodeURIComponent(raw));
  const editions = await fetchLiveMarketingEditionsForSeo();
  const edition = findMarketingEditionBySlug(editions, slug);
  if (!edition || !isMarketingEditionLive(edition)) {
    return { robots: { index: false, follow: true } };
  }
  return buildMarketingEditionMetadata(edition);
}

export default async function MarketingEditionShopPage({
  params,
}: {
  params: Params;
}) {
  const { slug: raw } = await params;
  const slug = normalizeMarketingEditionSlug(decodeURIComponent(raw));
  const editions = await fetchLiveMarketingEditionsForSeo();
  const edition = findMarketingEditionBySlug(editions, slug);
  if (!edition || !isMarketingEditionLive(edition)) {
    notFound();
  }

  const products = await fetchEditionProducts(slug);
  const jsonLd = buildMarketingEditionCollectionJsonLd({ edition, products });

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

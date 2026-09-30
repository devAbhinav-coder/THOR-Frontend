import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { imagesForProductColor } from "@/lib/productColorImages";

export type MerchantFeedProduct = {
  _id: string;
  isActive?: boolean;
  slug?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  seoDescription?: string;
  price?: number;
  comparePrice?: number;
  category?: string;
  subcategory?: string;
  fabric?: string;
  audience?: "women" | "men" | "kids" | "couple" | string;
  isPremium?: boolean;
  premiumSlug?: string;
  premiumSubtitle?: string;
  craftNote?: string;
  weaveHours?: number;
  premiumHeroImage?: { url?: string };
  images?: { url?: string; color?: string }[];
  variants?: Array<{
    _id?: string;
    sku?: string;
    price?: number;
    comparePrice?: number;
    stock?: number;
    color?: string;
    size?: string;
  }>;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

export function merchantProductStorefrontUrl(
  product: MerchantFeedProduct,
  siteUrl: string,
  variantColor?: string,
): string | null {
  const base = siteUrl.replace(/\/+$/, "");
  if (product.isPremium && product.premiumSlug) {
    return `${base}/premium/${encodeURIComponent(product.premiumSlug)}`;
  }
  const slug = product.slug || (product._id ? String(product._id) : "");
  if (!slug) return null;
  const shopBase = `${base}/shop/${encodeURIComponent(slug)}`;
  const color = variantColor?.trim();
  if (!color) return shopBase;
  return `${shopBase}?color=${encodeURIComponent(color)}`;
}

export function merchantProductTypeLabel(product: MerchantFeedProduct): string {
  const parts: string[] = [];
  if (product.isPremium) parts.push("Premium Edit");
  const audience = String(product.audience || "women").toUpperCase();
  parts.push(audience);
  if (product.category) parts.push(product.category);
  if (product.subcategory) parts.push(product.subcategory);
  if (product.fabric) parts.push(product.fabric);
  return parts.join(" > ");
}

export function merchantCatalogGender(
  audience?: string,
): string | undefined {
  const tag = String(audience || "women").toLowerCase();
  if (tag === "men") return "male";
  if (tag === "women") return "female";
  if (tag === "kids") return "unisex";
  if (tag === "couple") return "unisex";
  return "female";
}

export function merchantCatalogAgeGroup(audience?: string): string {
  return String(audience || "").toLowerCase() === "kids" ? "kids" : "adult";
}

export function truncateFeedText(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Up to 10 extra images for Meta/Google (excluding main image). */
export function merchantAdditionalImageUrls(
  product: MerchantFeedProduct,
  variantColor: string | undefined,
  siteUrl: string,
  mainImageUrl: string,
  max = 10,
): string[] {
  const images = product.images || [];
  const colorImages =
    variantColor ? imagesForProductColor(images, variantColor) : images;
  const pool =
    colorImages.length > 0 ? colorImages
    : images.length > 0 ? images
    : product.isPremium && product.premiumHeroImage?.url ?
      [product.premiumHeroImage]
    : [];

  const out: string[] = [];
  const seen = new Set<string>([mainImageUrl]);
  for (const img of pool) {
    const abs = absoluteMerchantImageUrl(img?.url, siteUrl);
    if (!abs || seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= max) break;
  }
  return out;
}

export function isMerchantFeedProductLive(product: MerchantFeedProduct): boolean {
  return product.isActive !== false;
}

export function absoluteMerchantImageUrl(
  url: string | undefined,
  siteUrl: string,
): string {
  const base = siteUrl.replace(/\/+$/, "");
  const trimmed = String(url || "").trim();
  if (!trimmed) return `${base}/images/hero-bg.jpg`;
  if (trimmed.startsWith("/")) return `${base}${trimmed}`;
  return trimmed;
}

export function merchantVariantImageUrl(
  product: MerchantFeedProduct,
  variantColor: string | undefined,
  siteUrl: string,
): string {
  if (product.isPremium && product.premiumHeroImage?.url) {
    return absoluteMerchantImageUrl(product.premiumHeroImage.url, siteUrl);
  }
  const images = product.images || [];
  if (variantColor) {
    const colorImages = imagesForProductColor(images, variantColor);
    const first = colorImages[0]?.url;
    if (first) return absoluteMerchantImageUrl(first, siteUrl);
  }
  return absoluteMerchantImageUrl(images[0]?.url, siteUrl);
}

async function fetchPaginatedProducts(
  basePath: string,
): Promise<MerchantFeedProduct[]> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  const all: MerchantFeedProduct[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetch(
      `${apiUrl}${basePath}?limit=${PAGE_SIZE}&page=${page}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) break;

    const json = (await res.json()) as {
      data?: { products?: MerchantFeedProduct[] };
      pagination?: { totalPages?: number; hasNextPage?: boolean };
    };
    const chunk = json?.data?.products;
    if (Array.isArray(chunk)) {
      for (const product of chunk) {
        const id = String(product?._id || "").trim();
        if (id && seenIds.has(id)) continue;
        if (id) seenIds.add(id);
        all.push(product);
      }
    }

    totalPages = Math.max(1, Number(json?.pagination?.totalPages || 1));
    const hasNext = json?.pagination?.hasNextPage ?? page < totalPages;
    if (!hasNext) break;
    page += 1;
  }

  return all;
}

/** Shop catalog products for Pinterest & Google Merchant feeds (both regular & premium). */
export async function fetchAllMerchantFeedProducts(): Promise<
  MerchantFeedProduct[]
> {
  const [catalog, premium] = await Promise.all([
    fetchPaginatedProducts("/products"),
    fetchPaginatedProducts("/premium/products"),
  ]);

  const byKey = new Map<string, MerchantFeedProduct>();
  for (const product of catalog) {
    if (!product?._id) continue;
    byKey.set(String(product._id), product);
  }
  for (const product of premium) {
    if (!product?._id) continue;
    const key = String(product._id);
    const existing = byKey.get(key);
    byKey.set(
      key,
      existing ?
        { ...existing, ...product, isPremium: true }
      : product,
    );
  }
  return Array.from(byKey.values()).filter(isMerchantFeedProductLive);
}

import { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import ShopLoading from "../../loading";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { getSiteUrl } from "@/lib/siteUrl";
import type { Category, Product } from "@/types";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { resolveCategoryBySlug, toShopCategorySlug } from "@/lib/shopCategorySeo";

const SITE_URL = getSiteUrl();

type ParamsInput = Promise<{ categorySlug: string }>;
type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function humanizeCategorySlug(input: string): string {
  const decoded = decodeURIComponent(String(input || "").trim());
  if (!decoded) return "Shop Category";
  return decoded
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchCategories(): Promise<Category[]> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return [];
  try {
    const res = await fetch(`${apiBase}/categories?active=true`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { categories?: Category[] } };
    const categories = Array.isArray(body?.data?.categories) ? body.data.categories : [];
    return categories.filter(isShopCatalogCategory);
  } catch {
    return [];
  }
}

function hasAnyFilters(sp: Record<string, string | string[] | undefined>): boolean {
  return Object.values(sp).some((v) => {
    if (typeof v === "string") return Boolean(v.trim());
    return Array.isArray(v) ? v.length > 0 : false;
  });
}

async function fetchTopProducts(categoryName: string): Promise<Product[]> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return [];
  try {
    const res = await fetch(
      `${apiBase}/products?limit=12&page=1&sort=featured&category=${encodeURIComponent(categoryName)}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { products?: Product[] } };
    return Array.isArray(body?.data?.products) ? body.data.products : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const [p, sp, categories] = await Promise.all([params, searchParams, fetchCategories()]);
  const resolved = resolveCategoryBySlug(categories, p.categorySlug);
  const fallbackName = humanizeCategorySlug(p.categorySlug);
  const category = resolved || {
    _id: "fallback",
    name: fallbackName,
    slug: toShopCategorySlug(p.categorySlug),
    isActive: true,
    subcategories: [],
    productCount: 0,
    createdAt: new Date().toISOString(),
  };

  const canonicalSlug =
    toShopCategorySlug(category.slug || category.name) ||
    toShopCategorySlug(p.categorySlug);
  const basePath = `/shop/category/${encodeURIComponent(canonicalSlug)}`;
  const filtered = hasAnyFilters(sp);
  const title = `${category.name} Sarees & Ethnic Wear | The House of Rani`;
  const description = `Browse ${category.name} at The House of Rani. Premium ethnic wear with trusted delivery, easy returns, and secure checkout.`;
  const ogImage = `${SITE_URL}/ogimage.png`;

  return {
    title,
    description,
    alternates: { canonical: basePath },
    robots: {
      index: !filtered,
      follow: true,
      googleBot: {
        index: !filtered,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${basePath}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${category.name} | The House of Rani` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: SearchParamsInput;
}) {
  const [p, sp, categories] = await Promise.all([params, searchParams, fetchCategories()]);
  const resolved = resolveCategoryBySlug(categories, p.categorySlug);
  const fallbackName = humanizeCategorySlug(p.categorySlug);
  const category = resolved || {
    _id: "fallback",
    name: fallbackName,
    slug: toShopCategorySlug(p.categorySlug),
    isActive: true,
    subcategories: [],
    productCount: 0,
    createdAt: new Date().toISOString(),
  };
  const canonicalSlug =
    toShopCategorySlug(category.slug || category.name) ||
    toShopCategorySlug(p.categorySlug);

  const filtered = hasAnyFilters(sp);
  const products = filtered ? [] : await fetchTopProducts(category.name);
  const canonicalPath = `/shop/category/${encodeURIComponent(canonicalSlug)}`;
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const categoryIntro =
    String(category.description || "").trim() ||
    `Explore ${category.name} collection at The House of Rani with premium craftsmanship, trusted delivery, and easy returns.`;

  const categoryLd =
    products.length === 0 ?
      null
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}${canonicalPath}#collectionpage`,
            name: `${category.name} Collection`,
            description: `Shop ${category.name} collection at The House of Rani.`,
            url: `${SITE_URL}${canonicalPath}`,
            inLanguage: "en-IN",
            isPartOf: { "@id": `${SITE_URL}/#website` },
          },
          {
            "@type": "ItemList",
            "@id": `${SITE_URL}${canonicalPath}#itemlist`,
            name: `${category.name} Products`,
            url: `${SITE_URL}${canonicalPath}`,
            numberOfItems: products.length,
            itemListElement: products
              .filter((item) => item?.slug && item?.name)
              .map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Product",
                  "@id": `${SITE_URL}/shop/${encodeURIComponent(item.slug)}#product`,
                  name: item.name,
                  url: `${SITE_URL}/shop/${encodeURIComponent(item.slug)}`,
                  image: item.images?.[0]?.url ? [item.images[0].url] : [`${SITE_URL}/ogimage.png`],
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "INR",
                    price: Number(item.price || 0).toFixed(2),
                    priceValidUntil,
                    availability:
                      item.totalStock > 0 ?
                        "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                    url: `${SITE_URL}/shop/${encodeURIComponent(item.slug)}`,
                    itemCondition: "https://schema.org/NewCondition",
                    seller: {
                      "@type": "Organization",
                      name: "The House of Rani",
                      url: SITE_URL,
                    },
                    hasMerchantReturnPolicy: {
                      "@type": "MerchantReturnPolicy",
                      applicableCountry: "IN",
                      returnPolicyCategory:
                        "https://schema.org/MerchantReturnFiniteReturnWindow",
                      merchantReturnDays: 7,
                      returnMethod: "https://schema.org/ReturnByMail",
                      returnFees: "https://schema.org/FreeReturn",
                    },
                    shippingDetails: {
                      "@type": "OfferShippingDetails",
                      shippingRate: {
                        "@type": "MonetaryAmount",
                        value: "0",
                        currency: "INR",
                      },
                      shippingDestination: {
                        "@type": "DefinedRegion",
                        addressCountry: "IN",
                      },
                      deliveryTime: {
                        "@type": "ShippingDeliveryTime",
                        handlingTime: {
                          "@type": "QuantitativeValue",
                          minValue: 1,
                          maxValue: 2,
                          unitCode: "DAY",
                        },
                        transitTime: {
                          "@type": "QuantitativeValue",
                          minValue: 3,
                          maxValue: 7,
                          unitCode: "DAY",
                        },
                      },
                    },
                  },
                },
              })),
          },
        ],
      };

  return (
    <>
      {categoryLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryLd) }}
        />
      )}
      <Suspense fallback={<ShopLoading />}>
        <ShopClient categoryContext={{ name: category.name, slug: canonicalSlug }} />
      </Suspense>
    </>
  );
}

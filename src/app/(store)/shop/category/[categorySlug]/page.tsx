import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const category = resolveCategoryBySlug(categories, p.categorySlug);
  if (!category) return {};

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
  const category = resolveCategoryBySlug(categories, p.categorySlug);
  if (!category) notFound();
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
      <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2'>
        <h1 className='sr-only'>{`${category.name} Sarees & Ethnic Wear`}</h1>
        <div className='rounded-2xl border border-gray-100 bg-white/95 px-4 py-4 sm:px-6'>
          <p className='text-xs font-semibold uppercase tracking-wider text-brand-600'>
            Shop Category
          </p>
          <p className='mt-2 text-sm leading-relaxed text-gray-700 sm:text-[15px]'>
            {categoryIntro}
          </p>
        </div>
      </section>
      <Suspense fallback={<ShopLoading />}>
        <ShopClient categoryContext={{ name: category.name, slug: canonicalSlug }} />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { getSiteUrl } from "@/lib/siteUrl";
import type { Category, Product, SubCategory } from "@/types";
import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";
import { resolveSerpTitleString } from "@/lib/pageSeo";
import {
  buildSubcategoryKeywords,
  buildSubcategoryMetaDescription,
  buildSubcategoryPageTitle,
} from "@/lib/subcategoryPageSeo";
import Image from "next/image";

const SITE_URL = getSiteUrl();

type ParamsInput = Promise<{ categorySlug: string; subcategorySlug: string }>;
type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function humanizeSlug(input: string): string {
  const decoded = decodeURIComponent(String(input || "").trim());
  if (!decoded) return "Shop";
  return decoded
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface SubcollectionDetails {
  category: Category;
  subcategory: SubCategory;
}

async function fetchSubcollectionDetails(catSlug: string, subSlug: string): Promise<SubcollectionDetails | null> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase}/collections/${encodeURIComponent(catSlug)}/${encodeURIComponent(subSlug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data as SubcollectionDetails;
  } catch {
    return null;
  }
}

function hasAnyFilters(sp: Record<string, string | string[] | undefined>): boolean {
  return Object.values(sp).some((v) => {
    if (typeof v === "string") return Boolean(v.trim());
    return Array.isArray(v) ? v.length > 0 : false;
  });
}

async function fetchTopSubcollectionProducts(catSlug: string, subSlug: string): Promise<Product[]> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return [];
  try {
    const res = await fetch(
      `${apiBase}/collections/${encodeURIComponent(catSlug)}/${encodeURIComponent(subSlug)}/products?limit=12&page=1&sort=featured`,
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
  const [p, sp] = await Promise.all([params, searchParams]);
  const details = await fetchSubcollectionDetails(p.categorySlug, p.subcategorySlug);
  
  const fallbackCatName = humanizeSlug(p.categorySlug);
  const fallbackSubName = humanizeSlug(p.subcategorySlug);
  
  const categoryName = details?.category?.name || fallbackCatName;
  const subcategoryName = details?.subcategory?.name || fallbackSubName;

  const basePath = `/shop/collections/${encodeURIComponent(p.categorySlug)}/${encodeURIComponent(p.subcategorySlug)}`;
  const filtered = hasAnyFilters(sp);
  
  // Use category page SEO as fallback, but prefix with subcategory
  const fallbackSeo = resolveCategoryPageSeo(categoryName, p.categorySlug);
  const title = buildSubcategoryPageTitle(
    subcategoryName,
    categoryName,
    details?.subcategory?.metaTitle,
  );
  const description = buildSubcategoryMetaDescription(
    subcategoryName,
    categoryName,
    details?.subcategory?.metaDescription,
  );
  const ogImage = details?.subcategory?.heroBannerImage?.url || details?.subcategory?.image || `${SITE_URL}/ogimage.png`;
  const ogTitle = resolveSerpTitleString(
    title,
    `${subcategoryName} ${categoryName} — Shop Online India`,
  );

  return {
    title,
    description,
    keywords: buildSubcategoryKeywords(
      subcategoryName,
      categoryName,
      fallbackSeo.keywords,
    ),
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
      title: ogTitle,
      description,
      url: `${SITE_URL}${basePath}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${subcategoryName} | The House of Rani` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShopSubcategoryPage({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: SearchParamsInput;
}) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const details = await fetchSubcollectionDetails(p.categorySlug, p.subcategorySlug);
  const fallbackCatName = humanizeSlug(p.categorySlug);
  const fallbackSubName = humanizeSlug(p.subcategorySlug);
  
  const categoryName = details?.category?.name || fallbackCatName;
  const subcategoryName = details?.subcategory?.name || fallbackSubName;

  const filtered = hasAnyFilters(sp);
  const products = filtered ? [] : await fetchTopSubcollectionProducts(p.categorySlug, p.subcategorySlug);
  const canonicalPath = `/shop/collections/${encodeURIComponent(p.categorySlug)}/${encodeURIComponent(p.subcategorySlug)}`;
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const subcategoryLd =
    filtered ?
      null
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}${canonicalPath}#collectionpage`,
            name: `${subcategoryName} ${categoryName}`,
            description: buildSubcategoryMetaDescription(
              subcategoryName,
              categoryName,
              details?.subcategory?.metaDescription,
            ),
            url: `${SITE_URL}${canonicalPath}`,
            inLanguage: "en-IN",
            isPartOf: { "@id": `${SITE_URL}/#website` },
            breadcrumb: { "@id": `${SITE_URL}${canonicalPath}#breadcrumb` },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${SITE_URL}${canonicalPath}#breadcrumb`,
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
                name: categoryName,
                item: `${SITE_URL}/shop/collections/${encodeURIComponent(p.categorySlug)}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: subcategoryName,
                item: `${SITE_URL}${canonicalPath}`,
              },
            ],
          },
          ...(products.length > 0 ?
            [
              {
                "@type": "ItemList",
                "@id": `${SITE_URL}${canonicalPath}#itemlist`,
                name: `${subcategoryName} Products`,
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
                      image:
                        item.images?.[0]?.url ?
                          [item.images[0].url]
                        : [`${SITE_URL}/ogimage.png`],
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
                          merchantReturnDays: 5,
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
                              maxValue: 3,
                              unitCode: "DAY",
                            },
                            transitTime: {
                              "@type": "QuantitativeValue",
                              minValue: 3,
                              maxValue: 10,
                              unitCode: "DAY",
                            },
                          },
                        },
                      },
                    },
                  })),
              },
            ]
          : []),
        ],
      };

  const heroBanner = details?.subcategory?.heroBannerImage?.url;

  return (
    <>
      {subcategoryLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(subcategoryLd) }}
        />
      )}
      {!filtered && heroBanner && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto mb-12 relative aspect-[21/9] md:aspect-[3/1] bg-rose-50 overflow-hidden md:rounded-2xl">
            <Image
              src={heroBanner}
              alt={`${subcategoryName} ${categoryName} collection`}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
               <p className="text-3xl md:text-5xl font-serif text-white text-center px-4 drop-shadow-md">
                 {subcategoryName} {categoryName}
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

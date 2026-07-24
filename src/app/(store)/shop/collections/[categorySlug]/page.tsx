import type { Metadata } from "next";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { getSiteUrl } from "@/lib/siteUrl";
import type { Category, Product, SubCategory } from "@/types";
import { resolveCategoryPageSeo } from "@/lib/categoryPageSeo";
import { resolveAdminSeoTitle, resolveSerpTitleString } from "@/lib/pageSeo";
import SubcategoryCards from "@/components/shop/SubcategoryCards";

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

interface CollectionDetails {
  category: Category;
  subcategories: SubCategory[];
}

async function fetchCollectionDetails(catSlug: string): Promise<CollectionDetails | null> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase}/collections/${encodeURIComponent(catSlug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data as CollectionDetails;
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

async function fetchTopCollectionProducts(catSlug: string): Promise<Product[]> {
  const apiBase = await getBuildSafeApiBase();
  if (!apiBase) return [];
  try {
    const res = await fetch(
      `${apiBase}/collections/${encodeURIComponent(catSlug)}/products?limit=12&page=1&sort=featured`,
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
  const details = await fetchCollectionDetails(p.categorySlug);
  
  const fallbackName = humanizeCategorySlug(p.categorySlug);
  const categoryName = details?.category?.name || fallbackName;

  const canonicalSlug = p.categorySlug;
  const basePath = `/shop/collections/${encodeURIComponent(canonicalSlug)}`;
  const filtered = hasAnyFilters(sp);
  const seo = resolveCategoryPageSeo(categoryName, canonicalSlug);
  
  const title = resolveAdminSeoTitle(
    details?.category?.metaTitle,
    seo.title,
  );
  const description = details?.category?.metaDescription || seo.description;
  const ogImage = details?.category?.heroBannerImage?.url || details?.category?.image || `${SITE_URL}/ogimage.png`;
  const ogTitle = resolveSerpTitleString(title, seo.title);

  return {
    title,
    description,
    keywords: seo.keywords,
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${categoryName} | The House of Rani` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
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
  const [p, sp] = await Promise.all([params, searchParams]);
  const details = await fetchCollectionDetails(p.categorySlug);
  const fallbackName = humanizeCategorySlug(p.categorySlug);
  const categoryName = details?.category?.name || fallbackName;
  const canonicalSlug = p.categorySlug;

  const filtered = hasAnyFilters(sp);
  const products = filtered ? [] : await fetchTopCollectionProducts(canonicalSlug);
  const canonicalPath = `/shop/collections/${encodeURIComponent(canonicalSlug)}`;
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const categoryLd =
    filtered ?
      null
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}${canonicalPath}#collectionpage`,
            name: `${categoryName} Collection`,
            description:
              details?.category?.metaDescription ||
              resolveCategoryPageSeo(categoryName, canonicalSlug).description,
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
                item: `${SITE_URL}${canonicalPath}`,
              },
            ],
          },
          ...(products.length > 0 ?
            [
              {
                "@type": "ItemList",
                "@id": `${SITE_URL}${canonicalPath}#itemlist`,
                name: `${categoryName} Products`,
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

  return (
    <>
      {categoryLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryLd) }}
        />
      )}
      {!filtered && details?.subcategories && details.subcategories.length > 0 && (
        <SubcategoryCards 
          category={details.category} 
          subcategories={details.subcategories} 
        />
      )}
    </>
  );
}

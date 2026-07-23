import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import type { Category, Product } from "@/types";
import { toShopCategorySlug } from "@/lib/shopCategorySeo";
import { SHOP_META_DESCRIPTION, SHOP_META_TITLE } from "@/lib/brandSeo";
import CategoryCards from "@/components/shop/CategoryCards";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";

const SITE_URL = getSiteUrl();

const baseTitle = SHOP_META_TITLE;
const baseDesc = SHOP_META_DESCRIPTION;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildCanonicalPath(sp: Record<string, string | string[] | undefined>) {
  void sp;
  return "/shop/collections";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const dec = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const cat = typeof sp.category === "string" ? dec(sp.category) : "";
  const fabric = typeof sp.fabric === "string" ? dec(sp.fabric) : "";
  const searchRaw = typeof sp.search === "string" ? dec(sp.search) : "";
  const search = searchRaw.slice(0, 48);
  const featured = sp.isFeatured === "true";
  const onSale = sp.onSale === "true";
  const hasOffer = sp.hasOffer === "true";
  const hasAnyFilter = Object.values(sp).some((v) => {
    if (typeof v === "string") return Boolean(v.trim());
    return Array.isArray(v) ? v.length > 0 : false;
  });

  const categoriesRaw =
    typeof sp.categories === "string" ? sp.categories.trim() : "";
  const legacyCategory =
    typeof sp.category === "string" ? sp.category.trim() : "";
  const categoryList = (categoriesRaw || legacyCategory)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (categoryList.length === 1 && !sp.fabrics) {
    const categorySlug = toShopCategorySlug(categoryList[0]);
    if (categorySlug) {
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(sp)) {
        if (key === "category" || key === "categories") continue;
        if (typeof value === "string" && value.trim()) q.set(key, value);
      }
      const qs = q.toString();
      permanentRedirect(
        qs ?
          `/shop/collections/${encodeURIComponent(categorySlug)}?${qs}`
        : `/shop/collections/${encodeURIComponent(categorySlug)}`,
      );
    }
  }

  let title = baseTitle;
  if (onSale) title = "Sale Sarees & Ethnic Wear Online India";
  else if (hasOffer) title = "Coupon Offers — Sarees & Ethnic Wear Online India";
  else if (featured) title = "Featured Sarees & Ethnic Wear Online India";
  else if (cat) title = `${cat} Sarees & Ethnic Wear Online India`;
  else if (fabric) title = `${fabric} Sarees — Shop Online India`;
  else if (search) title = `Search: ${search}`;

  let description = baseDesc;
  if (onSale) {
    description =
      "Shop sarees and ethnic wear on sale at The House of Rani — special pricing on select styles with free delivery and easy returns.";
  } else if (hasOffer) {
    description =
      "Shop products with active coupon offers at The House of Rani — copy a code at checkout for extra savings.";
  } else if (cat) {
    description = `Browse ${cat} at The House of Rani — premium ethnic wear with free delivery, easy returns, and filters for fabric, price, and ratings.`;
  } else if (search) {
    description = `Search results for "${search}" — premium sarees, lehengas, and ethnic wear at The House of Rani. Free delivery across India.`;
  } else if (featured) {
    description =
      "Handpicked featured sarees and ethnic wear at The House of Rani. Free delivery · 5-day returns · In stock items only.";
  }

  const appUrl = SITE_URL;
  const canonicalPath = buildCanonicalPath(sp);
  const ogImage = `${appUrl}/ogimage.png`;

  return {
    title,
    description,
    keywords: [
      "sarees online India",
      "salwar suits online India",
      "buy sarees online India",
      "women ethnic wear online",
      cat || "premium sarees",
      fabric || "Indian ethnic wear",
      "lehengas online",
      "designer salwar suits",
      "premium sarees India",
      "saree shop India",
      "The House of Rani",
      "ethnic wear online",
    ]
      .filter(Boolean)
      .join(", "),
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: !hasAnyFilter,
      follow: true,
      googleBot: {
        index: !hasAnyFilter,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title,
      description,
      url: `${appUrl}${canonicalPath}`,
      type: "website",
      siteName: "The House of Rani",
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "The House of Rani — Shop Premium Sarees & Indian Ethnic Wear",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Fetch top products server-side for CollectionPage ItemList JSON-LD. */
async function fetchTopProductsForSchema(): Promise<Product[]> {
  const base = await getBuildSafeApiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/products?limit=12&page=1&sort=featured`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { products?: Product[] } };
    return Array.isArray(json?.data?.products) ? json.data!.products! : [];
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  const base = await getBuildSafeApiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const allCats = Array.isArray(json?.data?.categories) ? json.data.categories : [];
    // Exclude Gifting
    return allCats.filter((c: Category) => c.name.toLowerCase() !== "gifting" && !c.isGiftCategory);
  } catch {
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const isFiltered = Object.values(sp).some((v) => v !== undefined);

  // Only inject rich JSON-LD on the unfiltered base /shop page —
  // filtered views (category, fabric, search) have dynamic titles/descriptions
  // handled by generateMetadata, but the ItemList would be stale/misleading.
  let collectionPageLd: object | null = null;
  if (!isFiltered) {
    const products = await fetchTopProductsForSchema();
    const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    /**
     * CollectionPage + ItemList JSON-LD on the shop listing page.
     *
     * This is the primary signal Google needs to show:
     *   ✅ Product carousel in search results
     *   ✅ Price (INR) next to the listing
     *   ✅ "In stock" / "Out of stock" badge
     *   ✅ "Free returns" badge (from hasMerchantReturnPolicy)
     *   ✅ "Free delivery" badge (from shippingDetails with rate: 0)
     *
     * Google follows each product URL to the PDP JSON-LD for full details.
     */
    collectionPageLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/shop/collections#collectionpage`,
          name: "Shop — Premium Sarees, Salwar Suits & Indian Ethnic Wear",
          description:
            "Browse the full collection of premium sarees, salwar suits, lehengas, and ethnic wear at The House of Rani. Free delivery · 5-day free returns.",
          url: `${SITE_URL}/shop/collections`,
          inLanguage: "en-IN",
          isPartOf: { "@id": `${SITE_URL}/#website` },
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
            ],
          },
        },
        ...(products.length > 0 ?
          [
            {
              "@type": "ItemList",
              "@id": `${SITE_URL}/shop/collections#itemlist`,
              name: "All Products — The House of Rani",
              url: `${SITE_URL}/shop/collections`,
              numberOfItems: products.length,
              itemListElement: products
                .filter((p) => p?.slug && p?.name)
                .map((p, idx) => ({
                  "@type": "ListItem",
                  position: idx + 1,
                  item: {
                    "@type": "Product",
                    "@id": `${SITE_URL}/shop/${encodeURIComponent(p.slug)}#product`,
                    name: p.name,
                    url: `${SITE_URL}/shop/${encodeURIComponent(p.slug)}`,
                    description:
                      p.shortDescription ||
                      String(p.description || "").slice(0, 160),
                    image:
                      p.images?.[0]?.url ?
                        [p.images[0].url]
                      : [`${SITE_URL}/ogimage.png`],
                    brand: {
                      "@type": "Brand",
                      name: "The House of Rani",
                    },
                    sku: p.variants?.[0]?.sku || p._id,
                    offers: {
                      "@type": "Offer",
                      priceCurrency: "INR",
                      price: Number(p.price || 0).toFixed(2),
                      priceValidUntil,
                      availability:
                        p.totalStock > 0 ?
                          "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                      itemCondition: "https://schema.org/NewCondition",
                      url: `${SITE_URL}/shop/${encodeURIComponent(p.slug)}`,
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
                    ...(Number(p.ratings?.count || 0) > 0 ?
                      {
                        aggregateRating: {
                          "@type": "AggregateRating",
                          ratingValue: String(p.ratings.average),
                          reviewCount: String(p.ratings.count),
                          bestRating: "5",
                          worstRating: "1",
                        },
                      }
                    : {}),
                  },
                })),
            },
          ]
        : []),
      ],
    };
  }

  const categoriesForCards = isFiltered ? [] : await fetchCategories();
  const storefrontSettings =
    isFiltered ? null : await fetchStorefrontSettingsHome();

  return (
    <>
      {collectionPageLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
        />
      )}
      {!isFiltered && (
        <div className="w-full">
          <CategoryCards
            categories={categoriesForCards}
            exploreHouseImages={storefrontSettings?.homeExploreHouse}
          />
        </div>
      )}
    </>
  );
}

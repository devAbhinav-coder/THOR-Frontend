import { Metadata } from "next";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { fetchProductBySlugServer } from "@/lib/storePrefetch";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

interface Props {
  params: Promise<{ slug: string }>;
}

type ProductReviewLite = {
  rating?: number;
  title?: string;
  comment?: string;
  createdAt?: string;
  user?: { name?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const safeSlug = encodeURIComponent(slug);
  const appUrl = getSiteUrl();
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) {
    return { title: "Product | The House of Rani" };
  }
  try {
    const res = await fetch(
      `${apiUrl}/products/${safeSlug}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      return {
        title: "Product Not Found",
        robots: { index: false, follow: true },
      };
    }
    const data = await res.json();
    const product = data.data.product;
    const descRaw =
      product.seoDescription ||
      product.shortDescription ||
      String(product.description || "").slice(0, 160);
    const ogImage = product.images?.[0]?.url;

    return {
      title: product.seoTitle || product.name,
      description: descRaw,
      alternates: {
        canonical: `/shop/${safeSlug}`,
      },
      robots: { index: true, follow: true },
      keywords: [
        product.name,
        product.category,
        product.fabric,
        ...(product.tags || []),
        "The House of Rani",
        "Indian ethnic wear",
      ]
        .filter(Boolean)
        .join(", "),
      openGraph: {
        title: product.name,
        description: descRaw,
        images: ogImage ?
          [{ url: ogImage, alt: product.name, width: 1200, height: 630 }]
        : undefined,
        /* "og:type" = "product" tells crawlers & social platforms this is a
           purchasable item — required for Facebook Catalog & Google Discovery. */
        type: "website",
        url: `${appUrl}/shop/${safeSlug}`,
        siteName: "The House of Rani",
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: descRaw,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch {
    return { title: "Product | The House of Rani" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const initialProduct = await fetchProductBySlugServer(slug);
  const safeSlug = encodeURIComponent(slug);
  const apiUrl = await getBuildSafeApiBase();
  const appUrl = getSiteUrl();
  let productLd: Record<string, unknown> | null = null;
  let breadcrumbLd: Record<string, unknown> | null = null;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/products/${safeSlug}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const product = data?.data?.product;
        if (product) {
          const productPageUrl = `${appUrl}/shop/${safeSlug}`;
          const productDesc =
            product.seoDescription ||
            product.shortDescription ||
            String(product.description || "").slice(0, 200);
          const images = (product.images || [])
            .map((img: { url?: string }) => img.url)
            .filter(Boolean);
          const sku = product?.variants?.[0]?.sku;
          const inStock = Number(product.totalStock || 0) > 0;
          let reviewEntries: Array<Record<string, unknown>> = [];

          try {
            const reviewsRes = await fetch(
              `${apiUrl}/reviews/product/${encodeURIComponent(product._id)}?limit=3&page=1`,
              { next: { revalidate: 1800 } },
            );
            if (reviewsRes.ok) {
              const reviewsJson = (await reviewsRes.json()) as {
                data?: { reviews?: ProductReviewLite[] };
              };
              const reviews = Array.isArray(reviewsJson?.data?.reviews)
                ? reviewsJson.data.reviews
                : [];
              reviewEntries = reviews
                .filter(
                  (r) =>
                    Number(r?.rating || 0) > 0 &&
                    (String(r?.comment || "").trim() ||
                      String(r?.title || "").trim()),
                )
                .slice(0, 3)
                .map((r) => ({
                  "@type": "Review",
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: String(Number(r.rating || 0)),
                    bestRating: "5",
                    worstRating: "1",
                  },
                  author: {
                    "@type": "Person",
                    name: String(r.user?.name || "Verified Buyer"),
                  },
                  ...(String(r.title || "").trim()
                    ? { name: String(r.title).trim() }
                    : {}),
                  reviewBody: String(r.comment || r.title || "").trim(),
                  ...(r.createdAt ? { datePublished: r.createdAt } : {}),
                }));
            }
          } catch {
            reviewEntries = [];
          }

          breadcrumbLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${appUrl}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: `${appUrl}/shop`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: productPageUrl,
              },
            ],
          };

          /**
           * priceValidUntil — Google Merchant Center REQUIRES this for free
           * listings.  We set it 1 year rolling from today.
           */
          const priceValidUntil = new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .slice(0, 10);

          productLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": `${productPageUrl}#product`,
            name: product.name,
            url: productPageUrl,
            description: productDesc,
            image: images,
            category: product.category,
            ...(product.fabric ? { material: product.fabric } : {}),
            ...(sku ? { sku } : {}),
            brand: { "@type": "Brand", name: "The House of Rani" },
            itemCondition: "https://schema.org/NewCondition",
            offers: {
              "@type": "Offer",
              url: productPageUrl,
              priceCurrency: "INR",
              price: Number(product.price || 0).toFixed(2),
              priceValidUntil,
              availability:
                inStock ?
                  "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: {
                "@type": "Organization",
                name: "The House of Rani",
                url: appUrl,
              },
              /**
               * hasMerchantReturnPolicy — REQUIRED by Google Merchant Center
               * for free listings (Shopping tab).
               * Maps to your /returns page policy.
               */
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "IN",
                returnPolicyCategory:
                  "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
              },
              /**
               * shippingDetails — REQUIRED by Google Merchant Center for
               * free listings.  Adjust transitTime to match your courier SLA.
               */
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
            ...(Number(product?.ratings?.count || 0) > 0 ?
              {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: String(product.ratings.average || 0),
                  reviewCount: String(product.ratings.count || 0),
                  bestRating: "5",
                  worstRating: "1",
                },
              }
            : {}),
            ...(reviewEntries.length > 0 ? { review: reviewEntries } : {}),
          };
        }
      }
    } catch {
      productLd = null;
    }
  }

  return (
    <>
      {productLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={initialProduct} />
    </>
  );
}

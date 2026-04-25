import { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroSection from "@/components/home/HeroSection";
import {
  fetchHomeCategoryStats,
  fetchHomeFeaturedProducts,
} from "@/lib/storePrefetch";
import { fetchStorefrontHeroSlides } from "@/lib/storefrontServer";
import { getSiteUrl } from "@/lib/siteUrl";

const CategorySection = dynamic(() => import("@/components/home/CategorySection"));
const FeaturedProducts = dynamic(() => import("@/components/home/FeaturedProducts"));
const HomeBanner = dynamic(() => import("@/components/home/HomeBanner"));
const ExploreCollection = dynamic(() => import("@/components/home/ExploreCollection"));
const HomeGiftShowcase = dynamic(() => import("@/components/home/HomeGiftShowcase"));
const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"));
const BlogBanner = dynamic(() => import("@/components/home/BlogBanner"));
const Testimonials = dynamic(() => import("@/components/home/Testimonials"));

const SITE_URL = getSiteUrl();
const OG_IMAGE = `${SITE_URL}/ogimage.png`;
const LOGO_IMAGE = `${SITE_URL}/logoNew.png`;

export const metadata: Metadata = {
  title: "Buy Premium Sarees Online & Handcrafted Gifts | The House of Rani",
  description:
    "Drape timeless elegance. Discover exquisite sarees, lehengas, and handcrafted gifts for every occasion — where heritage craftsmanship meets modern luxury. Free delivery across India.",
  keywords: [
    "sarees online India",
    "buy sarees online",
    "bridal sarees",
    "lehengas online",
    "Indian ethnic wear",
    "gifting sarees",
    "corporate gifting India",
    "handmade gifts India",
    "wedding gifts India",
    "The House of Rani",
    "House of Rani",
    "premium sarees",
    "salwar suits online",
    "festive wear India",
    "saree shop India",
    "ethnic wear online India",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    title: "Buy Premium Sarees & Handcrafted Gifts | The House of Rani",
    description:
      "Drape timeless elegance. Discover premium sarees & handcrafted gifts — where heritage meets modern luxury. Free delivery across India.",
    url: `${SITE_URL}/`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The House of Rani — Premium Indian Ethnic Wear & Gifting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Premium Sarees & Handcrafted Gifts | The House of Rani",
    description:
      "Premium sarees, bridal wear, and curated gifting collections for every occasion. Free delivery across India.",
    images: [OG_IMAGE],
  },
};

export default async function HomePage() {
  const [heroSlides, categoryStats, featuredProducts] = await Promise.all([
    fetchStorefrontHeroSlides(),
    fetchHomeCategoryStats(),
    fetchHomeFeaturedProducts(),
  ]);

  /**
   * WebPage JSON-LD — references the Organization and WebSite nodes
   * already emitted by the root layout (@graph), so we only add what's
   * unique to the home page here.
   *
   * Google uses WebPage.primaryImageOfPage for the Knowledge Panel hero
   * image, and breadcrumb for sitelinks in search results.
   */
  const homePageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: `${SITE_URL}/`,
    name: "Buy Premium Sarees Online & Handcrafted Gifts | The House of Rani",
    description:
      "Premium sarees and handcrafted gifting designed for elegance, tradition, and modern luxury. Free delivery across India.",
    inLanguage: "en-IN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: OG_IMAGE,
      width: 1200,
      height: 630,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
      ],
    },
    dateModified: new Date().toISOString(),
  };

  /**
   * LocalBusiness schema — helps Google show the brand in local / Maps
   * results and builds trust (shows the store is a real business).
   */
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${SITE_URL}/#store`,
    name: "The House of Rani",
    url: SITE_URL,
    logo: LOGO_IMAGE,
    image: OG_IMAGE,
    description:
      "Premium sarees, lehengas, and handcrafted gifting for every occasion — where heritage craftsmanship meets modern luxury.",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Net Banking",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    sameAs: [
      "https://www.instagram.com/housofrani",
    ],
  };

  /**
   * ItemList of featured products — enables Google's Product Carousel rich
   * result on the home page SERP.  Each item is a minimal Product schema
   * node that links back to the full PDP (where price/stock/return/shipping
   * details are fully declared).  Google follows those links to enrich the
   * carousel entry with price, availability, and free-returns badge.
   */
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const featuredItemListLd =
    featuredProducts && featuredProducts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Featured Products — The House of Rani",
          description:
            "Handpicked premium sarees and gifting collections from The House of Rani.",
          url: `${SITE_URL}/shop?isFeatured=true`,
          numberOfItems: featuredProducts.length,
          itemListElement: featuredProducts
            .filter((p) => p?.slug && p?.name)
            .slice(0, 12)
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
                  p.images?.[0]?.url
                    ? [p.images[0].url]
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
                    p.totalStock > 0
                      ? "https://schema.org/InStock"
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
                ...(Number(p.ratings?.count || 0) > 0
                  ? {
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
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      {featuredItemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredItemListLd) }}
        />
      )}
      <HeroSection initialSlides={heroSlides} />
      <CategorySection initialCategories={categoryStats} />
      <FeaturedProducts initialProducts={featuredProducts} />
      <HomeBanner />
      <ExploreCollection />
      <HomeGiftShowcase />
      <WhyChooseUs />
      <BlogBanner />
      <Testimonials />
    </>
  );
}

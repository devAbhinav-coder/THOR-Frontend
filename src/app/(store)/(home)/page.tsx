import { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroSection from "@/components/home/HeroSection";
import {
  fetchHomeCategoryStats,
  fetchHomeFeaturedProducts,
  fetchHomeLatestBlogs,
  fetchHomeSareeSubcategories,
} from "@/lib/storePrefetch";
import {
  fetchStorefrontHeroSlides,
  fetchStorefrontSettingsHome,
} from "@/lib/storefrontServer";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  HOME_KEYWORDS,
  HOME_META_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  HOME_OG_TITLE,
  HOME_TITLE,
  ORG_SCHEMA_DESCRIPTION,
  BRAND_SAME_AS,
} from "@/lib/brandSeo";
import { absolutePageTitle } from "@/lib/pageSeo";

const CategorySection = dynamic(() => import("@/components/home/CategorySection"));
const FeaturedProducts = dynamic(() => import("@/components/home/FeaturedProducts"));
const SareeCollections = dynamic(() => import("@/components/home/SareeCollections"));
const HomeMiddleBanner = dynamic(() => import("@/components/home/HomeMiddleBanner"));
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
  title: absolutePageTitle(HOME_TITLE),
  description: HOME_META_DESCRIPTION,
  keywords: [...HOME_KEYWORDS],
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
    title: HOME_OG_TITLE,
    description: HOME_OG_DESCRIPTION,
    url: `${SITE_URL}/`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The House of Rani — Premium Sarees, Salwar Suits & Corsets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_OG_TITLE,
    description: HOME_OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function HomePage() {
  const [heroSlides, categoryStats, featuredProducts, storefrontSettings, latestBlogs, sareeSubcategories] =
    await Promise.all([
      fetchStorefrontHeroSlides(),
      fetchHomeCategoryStats(),
      fetchHomeFeaturedProducts(),
      fetchStorefrontSettingsHome(),
      fetchHomeLatestBlogs(3),
      fetchHomeSareeSubcategories(),
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
    name: HOME_TITLE,
    description: HOME_META_DESCRIPTION,
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
          item: `${SITE_URL}/`,
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
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#store`,
    name: "The House of Rani",
    url: SITE_URL,
    logo: LOGO_IMAGE,
    image: OG_IMAGE,
    description: ORG_SCHEMA_DESCRIPTION,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Net Banking",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    sameAs: [...BRAND_SAME_AS],
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
          name: "Featured Sarees, Salwar Suits & Corsets — The House of Rani",
          description:
            "Handpicked premium sarees, salwar suits, and corsets from The House of Rani.",
          url: `${SITE_URL}/shop/collections`,
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
      <HeroSection
        initialSlides={heroSlides}
        announcementMessages={storefrontSettings?.announcementMessages ?? []}
      />
      <CategorySection
        initialCategories={categoryStats}
        exploreHouseImages={storefrontSettings?.homeExploreHouse}
      />
      {storefrontSettings?.homeMiddleBanner && (
        <HomeMiddleBanner banner={storefrontSettings.homeMiddleBanner} />
      )}
      <SareeCollections subcategories={sareeSubcategories} />
      <FeaturedProducts initialProducts={featuredProducts} />
      <HomeBanner initialSettings={storefrontSettings} />
      <ExploreCollection />
      <HomeGiftShowcase initialSettings={storefrontSettings} />
      <WhyChooseUs />
      <BlogBanner initialBlogs={latestBlogs} />
      <Testimonials />
    </>
  );
}

import type { Metadata } from "next";
import AboutPageClient from "@/components/about/AboutPageClient";
import { BRAND_NAME } from "@/lib/brandSeo";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";
import { resolveBrandSameAs } from "@/lib/socialLinks";
import { buildInfoPageMetadata } from "@/lib/infoPagesSeo";
import { aboutLinksForSchema, resolveAboutPageData } from "@/lib/aboutPageData";
import { getSiteUrl } from "@/lib/siteUrl";
import { FOUNDER_PORTRAIT_URL, FOUNDER_NAME } from "@/lib/aboutFounder";
import {
  ABOUT_FOUNDER_KNOWS_ABOUT,
  ABOUT_FOUNDER_SCHEMA_DESCRIPTION,
  ABOUT_KEYWORDS,
  ABOUT_METADATA_TITLE,
  ABOUT_META_DESCRIPTION,
  ABOUT_OG_IMAGE_ALT,
  ABOUT_ORGANIZATION_STORY,
  ABOUT_SCHEMA_HEADLINE,
} from "@/lib/aboutPageSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { visuals } = await resolveAboutPageData();
  const heroSrc = visuals.hero?.src?.trim();
  return {
    ...buildInfoPageMetadata({
      path: "/about",
      title: ABOUT_METADATA_TITLE,
      description: ABOUT_META_DESCRIPTION,
      priority: "support",
      ogImage: heroSrc || undefined,
      ogImageAlt: ABOUT_OG_IMAGE_ALT,
    }),
    keywords: [...ABOUT_KEYWORDS],
  };
}

export default async function AboutRoutePage() {
  const appUrl = getSiteUrl();
  const [aboutData, storefrontSettings] = await Promise.all([
    resolveAboutPageData(),
    fetchStorefrontSettingsHome(),
  ]);
  const { visuals, schemaImages, products, internalLinks } = aboutData;
  const brandSameAs = resolveBrandSameAs(storefrontSettings?.footer);
  const primaryImage =
    visuals.hero?.src ?? schemaImages[0]?.src ?? `${appUrl}/ogimage.png`;
  const schemaLinks = aboutLinksForSchema(internalLinks, appUrl);

  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${appUrl}/about#webpage`,
    url: `${appUrl}/about`,
    name: ABOUT_METADATA_TITLE,
    headline: ABOUT_SCHEMA_HEADLINE,
    description: ABOUT_META_DESCRIPTION,
    abstract: ABOUT_ORGANIZATION_STORY,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${appUrl}/#website` },
    about: { "@id": `${appUrl}/#organization` },
    publisher: { "@id": `${appUrl}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url:
        primaryImage.startsWith("http") ? primaryImage : (
          `${appUrl}${primaryImage}`
        ),
    },
    image: schemaImages.slice(0, 5).map((img) => ({
      "@type": "ImageObject",
      url: img.src.startsWith("http") ? img.src : `${appUrl}${img.src}`,
      caption: img.alt,
    })),
    breadcrumb: {
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
          name: "About Us",
          item: `${appUrl}/about`,
        },
      ],
    },
    mainEntity: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: BRAND_NAME,
      description: ABOUT_ORGANIZATION_STORY,
      sameAs: brandSameAs,
      founder: {
        "@type": "Person",
        "@id": `${appUrl}/about#founder`,
        name: FOUNDER_NAME,
        jobTitle: "Founder",
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Northern India Institute of Fashion Technology (NIIFT)",
        },
        image: FOUNDER_PORTRAIT_URL,
        description: ABOUT_FOUNDER_SCHEMA_DESCRIPTION,
        worksFor: { "@id": `${appUrl}/#organization` },
      },
    },
  };

  const founderLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${appUrl}/about#founder`,
    name: FOUNDER_NAME,
    jobTitle: "Founder",
    image: FOUNDER_PORTRAIT_URL,
    url: `${appUrl}/about`,
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Northern India Institute of Fashion Technology (NIIFT)",
    },
    description: ABOUT_FOUNDER_SCHEMA_DESCRIPTION,
    worksFor: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: BRAND_NAME,
    },
    knowsAbout: [...ABOUT_FOUNDER_KNOWS_ABOUT],
  };

  /** Helps crawlers discover key internal destinations from the About page. */
  const siteNavLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${BRAND_NAME} - site sections`,
    itemListElement: schemaLinks.map((link, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: link.name,
      url: link.url,
    })),
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavLd) }}
      />
      <AboutPageClient
        visuals={visuals}
        products={products}
        internalLinks={internalLinks}
      />
    </>
  );
}

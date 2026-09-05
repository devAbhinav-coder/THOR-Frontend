import type { Metadata } from "next";
import AboutPageClient from "@/components/about/AboutPageClient";
import { BRAND_NAME, BRAND_SAME_AS } from "@/lib/brandSeo";
import { buildInfoPageMetadata } from "@/lib/infoPagesSeo";
import {
  aboutLinksForSchema,
  resolveAboutPageData,
} from "@/lib/aboutPageData";
import { getSiteUrl } from "@/lib/siteUrl";
import { FOUNDER_PORTRAIT_URL } from "@/lib/aboutFounder";

const ABOUT_TITLE = "About Us — Where Stories Are Woven";
const ABOUT_DESCRIPTION =
  "The House of Rani — founded by textile designer Priya Rani. Premium sarees, salwar suits & corsets with heritage craftsmanship, and The Rani Premium Edit across India.";

export const metadata: Metadata = {
  ...buildInfoPageMetadata({
    path: "/about",
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    priority: "support",
  }),
  keywords: [
    "about The House of Rani",
    "Priya Rani founder",
    "House of Rani story",
    "ethnic saree brand India",
    "salwar suits brand India",
    "ethnic corsets India",
    "modern ethnic sarees",
    "Kalamkari sarees",
    "story-led saree designs",
    "handcrafted Indian sarees",
    "premium sarees online",
    "Indian ethnic wear brand",
    "hand painted saree",
    "pure silk saree brand",
    "NIIFT textile designer",
  ],
};

export default async function AboutRoutePage() {
  const appUrl = getSiteUrl();
  const { visuals, schemaImages, products, internalLinks } =
    await resolveAboutPageData();
  const primaryImage =
    visuals.hero?.src ?? schemaImages[0]?.src ?? `${appUrl}/ogimage.png`;
  const schemaLinks = aboutLinksForSchema(internalLinks, appUrl);

  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${appUrl}/about#webpage`,
    url: `${appUrl}/about`,
    name: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${appUrl}/#website` },
    about: { "@id": `${appUrl}/#organization` },
    publisher: { "@id": `${appUrl}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: primaryImage.startsWith("http")
        ? primaryImage
        : `${appUrl}${primaryImage}`,
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
          name: "About",
          item: `${appUrl}/about`,
        },
      ],
    },
    mainEntity: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: BRAND_NAME,
      description: ABOUT_DESCRIPTION,
      sameAs: [...BRAND_SAME_AS],
      founder: {
        "@type": "Person",
        "@id": `${appUrl}/about#founder`,
        name: "Priya Rani",
        jobTitle: "Founder",
        birthDate: "1999",
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Northern India Institute of Fashion Technology (NIIFT)",
        },
        image: FOUNDER_PORTRAIT_URL,
        description:
          "Textile designer and Founder of The House of Rani — bridging India's regional crafts with contemporary ethnic wear.",
        worksFor: { "@id": `${appUrl}/#organization` },
      },
    },
  };

  const founderLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${appUrl}/about#founder`,
    name: "Priya Rani",
    jobTitle: "Founder",
    birthDate: "1999",
    image: FOUNDER_PORTRAIT_URL,
    url: `${appUrl}/about`,
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Northern India Institute of Fashion Technology (NIIFT)",
    },
    description:
      "Priya Rani is a textile designer and Founder of The House of Rani. Trained at NIIFT, she leads the brand's vision of reviving India's regional crafts with a contemporary sensibility.",
    worksFor: {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: BRAND_NAME,
    },
    knowsAbout: [
      "Textile design",
      "Indian regional crafts",
      "Kalamkari",
      "Ethnic wear",
      "Saree design",
    ],
  };

  /** Helps crawlers discover key internal destinations from the About page. */
  const siteNavLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${BRAND_NAME} — site sections`,
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
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderLd) }}
      />
      <script
        type="application/ld+json"
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

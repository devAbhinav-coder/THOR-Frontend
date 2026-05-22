import type { Metadata } from "next";
import AboutPageClient from "@/components/about/AboutPageClient";
import { BRAND_NAME } from "@/lib/brandSeo";
import { buildInfoPageMetadata } from "@/lib/infoPagesSeo";
import {
  aboutLinksForSchema,
  resolveAboutPageData,
} from "@/lib/aboutPageData";
import { getSiteUrl } from "@/lib/siteUrl";

const ABOUT_TITLE = "About Us — Where Stories Are Woven";
const ABOUT_DESCRIPTION =
  "Discover The House of Rani — modern ethnic sarees with hand-crafted Kalamkari motifs, story-led designs, and heritage craftsmanship made for everyday elegance across India.";

export const metadata: Metadata = {
  ...buildInfoPageMetadata({
    path: "/about",
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    priority: "support",
  }),
  keywords: [
    "about The House of Rani",
    "House of Rani story",
    "ethnic saree brand India",
    "modern ethnic sarees",
    "Kalamkari sarees",
    "story-led saree designs",
    "handcrafted Indian sarees",
    "premium sarees online",
    "Indian ethnic wear brand",
  ],
};

export default async function AboutRoutePage() {
  const appUrl = getSiteUrl();
  const { images, products, internalLinks } = await resolveAboutPageData();
  const primaryImage = images[0]?.src ?? `${appUrl}/ogimage.png`;
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
    image: images.slice(0, 5).map((img) => ({
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
      sameAs: ["https://www.instagram.com/houseofrani"],
    },
  };

  const breadcrumbLd = {
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
        name: "About Us",
        item: `${appUrl}/about`,
      },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavLd) }}
      />
      <AboutPageClient
        images={images}
        products={products}
        internalLinks={internalLinks}
      />
    </>
  );
}

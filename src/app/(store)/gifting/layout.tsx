import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const appUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Gifting Collection",
  description:
    "Explore thoughtful gifting at The House of Rani with curated premium picks, customizable gift options, and elegant choices for every celebration.",
  alternates: {
    canonical: "/gifting",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Gifting Collection | The House of Rani",
    description:
      "Premium gifting made effortless with curated and customizable options for weddings, celebrations, and corporate occasions.",
    url: `${appUrl}/gifting`,
    type: "website",
    siteName: "The House of Rani",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gifting Collection | The House of Rani",
    description:
      "Curated and customizable gifting for weddings, celebrations, and corporate occasions.",
  },
};

export default function GiftingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

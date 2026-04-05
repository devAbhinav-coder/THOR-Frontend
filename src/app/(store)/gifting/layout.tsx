import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gifting Collection",
  description:
    "Explore thoughtful gifting at The House of Rani with curated premium picks, customizable gift options, and elegant choices for every celebration.",
  alternates: {
    canonical: "/gifting",
  },
  openGraph: {
    title: "Gifting Collection | The House of Rani",
    description:
      "Premium gifting made effortless with curated and customizable options for weddings, celebrations, and corporate occasions.",
    url: "/gifting",
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

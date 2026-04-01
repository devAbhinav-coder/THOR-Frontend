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
};

export default function GiftingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

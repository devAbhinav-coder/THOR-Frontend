import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Read the House of Rani Journal for saree styling advice, bridal inspiration, gifting ideas, and behind-the-scenes stories from our atelier.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "House of Rani Journal",
    description:
      "Saree styling tips, bridal insights, gifting ideas, and stories from The House of Rani.",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Rani Journal",
    description:
      "Saree styling, bridal inspiration, gifting ideas, and stories from our atelier.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

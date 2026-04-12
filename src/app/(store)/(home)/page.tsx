import { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroSection from "@/components/home/HeroSection";
import {
  fetchHomeCategoryStats,
  fetchHomeFeaturedProducts,
} from "@/lib/storePrefetch";
import { fetchStorefrontHeroSlides } from "@/lib/storefrontServer";

const CategorySection = dynamic(() => import("@/components/home/CategorySection"));
const FeaturedProducts = dynamic(() => import("@/components/home/FeaturedProducts"));
const HomeBanner = dynamic(() => import("@/components/home/HomeBanner"));
const ExploreCollection = dynamic(() => import("@/components/home/ExploreCollection"));
const HomeGiftShowcase = dynamic(() => import("@/components/home/HomeGiftShowcase"));
const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"));
const BlogBanner = dynamic(() => import("@/components/home/BlogBanner"));
const Testimonials = dynamic(() => import("@/components/home/Testimonials"));

export const metadata: Metadata = {
  title: "The House of Rani | Premium Indian Ethnic Wear",
  description:
    "At The House of Rani, discover premium sarees, bridal styles, and thoughtful gifting collections with elegant designs delivered to your doorstep.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The House of Rani | Premium Sarees and Gifting",
    description:
      "Skip crowded markets and explore premium sarees, bridal wear, and curated gifting collections for every special occasion.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The House of Rani | Premium Sarees and Gifting",
    description:
      "Premium sarees, bridal wear, and curated gifting collections for every occasion.",
  },
};

export default async function HomePage() {
  const [heroSlides, categoryStats, featuredProducts] = await Promise.all([
    fetchStorefrontHeroSlides(),
    fetchHomeCategoryStats(),
    fetchHomeFeaturedProducts(),
  ]);

  return (
    <>
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

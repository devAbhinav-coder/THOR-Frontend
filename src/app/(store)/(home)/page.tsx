import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ExploreCollection from "@/components/home/ExploreCollection";
import HomeBanner from "@/components/home/HomeBanner";
import CategorySection from "@/components/home/CategorySection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Testimonials from "@/components/home/Testimonials";
import BlogBanner from "@/components/home/BlogBanner";

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
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <HomeBanner />
      <ExploreCollection />
      <WhyChooseUs />
      <BlogBanner />
      <Testimonials />
    </>
  );
}

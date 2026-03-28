import { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import ExploreCollection from '@/components/home/ExploreCollection';
import HomeBanner from '@/components/home/HomeBanner';
import CategorySection from '@/components/home/CategorySection';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';

export const metadata: Metadata = {
  title: 'The House of Rani | Premium Indian Ethnic Wear',
  description:
    'Discover exquisite Indian ethnic wear — handpicked sarees, lehengas, salwar suits and more. Shop the finest collection with free shipping on orders above ₹999.',
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
      <Testimonials />
    </>
  );
}

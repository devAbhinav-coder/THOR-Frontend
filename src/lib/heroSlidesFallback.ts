import type { HeroSlide } from "@/types";

/** Shared defaults when storefront API is empty or unreachable (keeps SSR + client in sync). */
export const fallbackHeroSlides: HeroSlide[] = [
  {
    title: "Elegance in Every Thread",
    subtitle: "New Silk Saree Collection",
    description:
      "Discover our handwoven Banarasi and Kanjeevaram silk sarees — timeless beauty for every occasion.",
    ctaText: "Shop Sarees",
    ctaLink: "/shop?category=Sarees",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    badge: "New Collection",
  },
  {
    title: "Bridal Dreams Come True",
    subtitle: "Exclusive Lehenga Collection",
    description:
      "Make your special day unforgettable with our exquisite bridal lehengas, crafted for the modern bride.",
    ctaText: "Explore Lehengas",
    ctaLink: "/shop?category=Lehengas",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    badge: "Bridal 2025",
  },
  {
    title: "Casual Chic Every Day",
    subtitle: "Designer Kurtis & Suits",
    description:
      "Effortlessly stylish kurtis and salwar suits for every mood and every moment of your day.",
    ctaText: "Shop Now",
    ctaLink: "/shop?category=Kurtis",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop",
    image: "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=1200&q=80",
    badge: "Best Sellers",
  },
];

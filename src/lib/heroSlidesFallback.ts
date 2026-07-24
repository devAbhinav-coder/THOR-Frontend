import type { HeroSlide } from "@/types";

/** Shared defaults when storefront API is empty or unreachable (keeps SSR + client in sync). */
export const fallbackHeroSlides: HeroSlide[] = [
  {
    title: "Elegance in Every Thread",
    subtitle: "New Silk Saree Collection",
    description:
      "Discover our handwoven Banarasi and Kanjeevaram silk sarees — timeless beauty for every occasion.",
    ctaText: "Shop Sarees",
    ctaLink: "/shop/collections/sarees",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop/collections",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    badge: "New Collection",
  },
  {
    title: "Structure Meets Softness",
    subtitle: "Corsets & Ethnic Tops",
    description:
      "Pair structured corsets with sarees and salwar suits — modern fits crafted for celebrations and everyday elegance.",
    ctaText: "Explore Corsets",
    ctaLink: "/shop/collections/corsets",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop/collections",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    badge: "Corsets",
  },
  {
    title: "Everyday Ethnic Ease",
    subtitle: "Designer Salwar Suits",
    description:
      "Effortlessly stylish salwar suits for every mood and every moment of your day.",
    ctaText: "Shop Salwar Suits",
    ctaLink: "/shop/collections/salwar-suits",
    secondaryCtaText: "View All",
    secondaryCtaLink: "/shop/collections",
    image: "https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=1200&q=80",
    badge: "Best Sellers",
  },
];

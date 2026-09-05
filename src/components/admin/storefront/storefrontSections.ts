import type { LucideIcon } from 'lucide-react';
import {
  Megaphone,
  ImageIcon,
  LayoutGrid,
  Percent,
  BookOpen,
  ShoppingBag,
  Settings2,
} from 'lucide-react';

export type StorefrontSectionId =
  | 'announcement'
  | 'hero'
  | 'exploreHouse'
  | 'promo'
  | 'blog'
  | 'shopBanner'
  | 'middleBanner'
  | 'homePremium'
  | 'premiumBanners'
  | 'footer';

export type StorefrontSectionMeta = {
  id: StorefrontSectionId;
  label: string;
  group: string;
  description: string;
  icon: LucideIcon;
};

export const STOREFRONT_SECTIONS: StorefrontSectionMeta[] = [
  {
    id: 'announcement',
    label: 'Announcements',
    group: 'Site-wide',
    description: 'Rotating messages shown at the top of every page',
    icon: Megaphone,
  },
  {
    id: 'footer',
    label: 'Footer & contact',
    group: 'Site-wide',
    description: 'Footer copy, contact details, and social links',
    icon: Settings2,
  },
  {
    id: 'hero',
    label: 'Hero carousel',
    group: 'Homepage',
    description: 'Full-screen hero slides on the homepage',
    icon: ImageIcon,
  },
  {
    id: 'exploreHouse',
    label: 'Explore our house',
    group: 'Homepage',
    description: 'Sale and Premium Edit card images on the homepage',
    icon: LayoutGrid,
  },
  {
    id: 'promo',
    label: 'Promo & editorial',
    group: 'Homepage',
    description: 'Mid-page promo banner, perks, and editorial image grid',
    icon: Percent,
  },
  {
    id: 'middleBanner',
    label: 'Middle banner',
    group: 'Homepage',
    description: 'Banner section in the middle of the homepage',
    icon: ImageIcon,
  },
  {
    id: 'homePremium',
    label: 'Premium showcase',
    group: 'Homepage',
    description:
      'Premium Edit block above the blog — image, copy, and CTA (same upload flow as other homepage images)',
    icon: ImageIcon,
  },
  {
    id: 'shopBanner',
    label: 'Shop banner',
    group: 'Shop',
    description: 'Triptych banner at the top of the shop page',
    icon: ShoppingBag,
  },
  {
    id: 'blog',
    label: 'Blog banner',
    group: 'Blog',
    description: 'Featured images on the journal / blog listing',
    icon: BookOpen,
  },
  {
    id: 'premiumBanners',
    label: 'Premium audience banners',
    group: 'Premium',
    description:
      '21:9 hero banners for /premium (All, Women, Men, Kids, Couples). Crop here = what shoppers see.',
    icon: ImageIcon,
  },
];

export const STOREFRONT_SECTION_GROUPS = Array.from(
  new Set(STOREFRONT_SECTIONS.map((s) => s.group)),
);

export function getStorefrontSection(id: StorefrontSectionId) {
  return STOREFRONT_SECTIONS.find((s) => s.id === id)!;
}

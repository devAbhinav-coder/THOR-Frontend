import { Suspense } from 'react';
import { Metadata } from 'next';
import ShopClient from '@/components/shop/ShopClient';
import ShopLoading from './loading';

export const metadata: Metadata = {
  title: 'Shop | The House of Rani',
  description:
    'Shop premium sarees, lehengas, and ethnic wear at The House of Rani. Filter by category, fabric, price, and rating to find your perfect look.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop | The House of Rani',
    description:
      'Premium sarees, lehengas, and ethnic wear — filter by category, fabric, price, and rating.',
    url: '/shop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop | The House of Rani',
    description:
      'Premium sarees, lehengas, and ethnic wear at The House of Rani.',
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopClient />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { Metadata } from 'next';
import ShopClient from '@/components/shop/ShopClient';

export const metadata: Metadata = {
  title: 'Shop | The House of Rani',
  description:
    'Shop premium sarees, lehengas, and ethnic wear at The House of Rani. Filter by category, fabric, price, and rating to find your perfect look.',
  alternates: {
    canonical: '/shop',
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-gray-400 text-sm">Loading shop…</div>}>
      <ShopClient />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { Metadata } from 'next';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import CheckoutLoading from './loading';

export const metadata: Metadata = {
  title: 'Checkout | The House of Rani',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutClient />
    </Suspense>
  );
}

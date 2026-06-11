import { Metadata } from 'next';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | The House of Rani',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}

import { Metadata } from 'next';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export const metadata: Metadata = { title: 'Checkout | The House of Rani' };

export default function CheckoutPage() {
  return <CheckoutClient />;
}

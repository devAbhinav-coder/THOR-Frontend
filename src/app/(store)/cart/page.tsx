import { Metadata } from 'next';
import CartClient from '@/components/cart/CartClient';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartClient />;
}

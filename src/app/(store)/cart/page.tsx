import { Metadata } from 'next';
import CartClient from '@/components/cart/CartClient';

export const metadata: Metadata = { title: 'Shopping Cart | The House of Rani' };

export default function CartPage() {
  return <CartClient />;
}

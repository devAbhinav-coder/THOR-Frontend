'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { products } = useWishlistStore();

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Your wishlist is empty</h3>
        <p className="text-gray-500 text-sm mb-4">Save items you love to your wishlist.</p>
        <Link href="/shop" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
          Browse Products →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 text-lg mb-4">My Wishlist ({products.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch [&>*]:h-full [&>*]:min-h-0">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

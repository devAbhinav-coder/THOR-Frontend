import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import { wishlistApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistState {
  products: Product[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,

      fetchWishlist: async () => {
        set({ isLoading: true });
        try {
          const body = await wishlistApi.get();
          set({ products: body.data.products });
        } catch {
          // silent fail
        } finally {
          set({ isLoading: false });
        }
      },

      toggleWishlist: async (productId) => {
        const isIn = get().isInWishlist(productId);
        try {
          await wishlistApi.toggle(productId);
          if (isIn) {
            set((state) => ({
              products: state.products.filter((p) => p._id !== productId),
            }));
            toast.success('Removed from wishlist');
          } else {
            toast.success('Added to wishlist');
            await get().fetchWishlist();
          }
        } catch {
          toast.error('Failed to update wishlist');
        }
      },

      isInWishlist: (productId) => {
        return get().products.some((p) => p._id === productId);
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ products: state.products }),
    }
  )
);

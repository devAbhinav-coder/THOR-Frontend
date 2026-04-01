import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import { wishlistApi } from '@/lib/api';
import toast from 'react-hot-toast';

/** In-flight toggles (not persisted) — avoids double requests and bad optimistic stacks */
const toggleInFlight = new Set<string>();

interface WishlistState {
  products: Product[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  /** Pass `product` when adding from PDP/card so the heart + count update instantly */
  toggleWishlist: (productId: string, product?: Product) => Promise<void>;
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

      toggleWishlist: async (productId, product) => {
        if (toggleInFlight.has(productId)) return;
        const isIn = get().isInWishlist(productId);
        const previous = get().products.slice();

        if (isIn) {
          set((state) => ({
            products: state.products.filter((p) => p._id !== productId),
          }));
        } else if (product) {
          set((state) =>
            state.products.some((p) => p._id === productId)
              ? state
              : { products: [...state.products, product] },
          );
        }

        toggleInFlight.add(productId);
        try {
          await wishlistApi.toggle(productId);
          if (isIn) {
            toast.success('Removed from wishlist');
          } else {
            toast.success('Added to wishlist');
            if (!product) await get().fetchWishlist();
          }
        } catch {
          set({ products: previous });
          toast.error('Failed to update wishlist');
        } finally {
          toggleInFlight.delete(productId);
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

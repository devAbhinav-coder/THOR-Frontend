import { create } from 'zustand';
import { Product } from '@/types';
import { wishlistApi } from '@/lib/api';
import { getQueryClient, WISHLIST_QUERY_KEY } from '@/lib/queryClient';
import toast from 'react-hot-toast';

const toggleInFlight = new Set<string>();

interface WishlistState {
  wishlistSet: Record<string, boolean>;
  wishlistCount: number;
  syncWishlist: (products: Product[]) => void;
  toggleWishlist: (
    productId: string,
    product?: Product,
    options?: { silent?: boolean },
  ) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistSet: {},
  wishlistCount: 0,

  syncWishlist: (products: Product[]) => {
    const map: Record<string, boolean> = {};
    (products || []).forEach((p) => {
      const id = String(p._id || (p as unknown as { id?: string }).id || '');
      if (id) map[id] = true;
    });
    set({ wishlistSet: map, wishlistCount: Object.keys(map).length });
  },

  isInWishlist: (productId: string) => {
    if (!productId) return false;
    return Boolean(get().wishlistSet[productId]);
  },

  toggleWishlist: async (
    productId: string,
    product?: Product,
    options?: { silent?: boolean },
  ) => {
    if (!productId || toggleInFlight.has(productId)) return;

    const previousSet = get().wishlistSet;
    const isIn = Boolean(previousSet[productId]);
    const silent = options?.silent === true;

    // 0ms Synchronous UI update for instant heart toggle & badge count
    const nextSet = { ...previousSet };
    if (isIn) {
      delete nextSet[productId];
    } else {
      nextSet[productId] = true;
    }

    set({ wishlistSet: nextSet, wishlistCount: Object.keys(nextSet).length });

    // Optimistically update React Query cache as well
    const qc = getQueryClient();
    const previousProducts = qc.getQueryData<Product[]>(WISHLIST_QUERY_KEY) ?? [];
    if (isIn) {
      qc.setQueryData<Product[]>(
        WISHLIST_QUERY_KEY,
        previousProducts.filter(
          (p) => String(p._id || (p as unknown as { id?: string }).id) !== productId,
        ),
      );
    } else if (product) {
      if (
        !previousProducts.some(
          (p) => String(p._id || (p as unknown as { id?: string }).id) === productId,
        )
      ) {
        qc.setQueryData<Product[]>(WISHLIST_QUERY_KEY, [...previousProducts, product]);
      }
    }

    toggleInFlight.add(productId);
    try {
      await wishlistApi.toggle(productId);
      if (!silent) {
        toast.success(isIn ? 'Removed from wishlist' : 'Added to wishlist', {
          id: 'wishlist-toggle-toast',
          duration: 1200,
        });
      }
      await qc.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    } catch {
      // Rollback on failure
      set({ wishlistSet: previousSet, wishlistCount: Object.keys(previousSet).length });
      qc.setQueryData<Product[]>(WISHLIST_QUERY_KEY, previousProducts);
      if (!silent) toast.error('Failed to update wishlist');
    } finally {
      toggleInFlight.delete(productId);
    }
  },
}));

/** Call once on client if needed — noop for in-memory wishlist store. */
export function rehydrateWishlistStore(): void {}

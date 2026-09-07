import { useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/lib/api';
import { Product } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { WISHLIST_QUERY_KEY } from '@/lib/queryClient';

export { WISHLIST_QUERY_KEY };

/**
 * Fetches the user's wishlist from the server using React Query.
 * - Syncs the result into Zustand (useWishlistStore) so all consumers
 *   have 0ms instant reactivity.
 * - Only runs when the user is authenticated.
 * - Caches data for 2 minutes; auto-refetches on window focus.
 */
export function useWishlistQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Product[]>({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: async () => {
      const res = await wishlistApi.get();
      const products = res.data.products || [];
      useWishlistStore.getState().syncWishlist(products);
      return products;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: [],
  });
}

/**
 * Returns a stable helper to manually update the wishlist cache.
 */
export function useWishlistQueryClient() {
  return useQueryClient();
}

import { getQueryClient, CART_QUERY_KEY, WISHLIST_QUERY_KEY } from '@/lib/queryClient';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

/** Call on logout / session loss so badges & caches never leak across users. */
export function clearSessionCommerceCaches(): void {
  useCartStore.getState().resetCart();
  useWishlistStore.getState().syncWishlist([]);
  try {
    const qc = getQueryClient();
    qc.removeQueries({ queryKey: CART_QUERY_KEY });
    qc.removeQueries({ queryKey: WISHLIST_QUERY_KEY });
  } catch {
    /* QueryClient may not be ready */
  }
}

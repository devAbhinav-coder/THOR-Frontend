import { useQuery } from '@tanstack/react-query';
import { cartApi } from '@/lib/api';
import { Cart } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { publishCart } from '@/store/useCartStore';
import { useEffect } from 'react';
import { CART_QUERY_KEY } from '@/lib/queryClient';

export { CART_QUERY_KEY };

/**
 * Fetches the cart from the server using React Query.
 * - Syncs into Zustand (coupon-aware) without rewriting RQ cache.
 * - Only runs when the user is authenticated.
 */
export function useCartQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery<Cart | null>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const body = await cartApi.get();
      return body.data.cart ?? null;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    placeholderData: null,
  });

  useEffect(() => {
    if (query.data === undefined) return;
    // RQ is source of truth here — do not setQueryData again
    publishCart(query.data, { syncQuery: false });
  }, [query.data]);

  return query;
}

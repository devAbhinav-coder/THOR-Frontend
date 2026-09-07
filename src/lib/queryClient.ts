import { QueryClient } from '@tanstack/react-query';

/**
 * Module-level QueryClient singleton.
 * Used by Zustand stores (outside React components) to read/write
 * the React Query cache for optimistic updates without prop drilling.
 */
let queryClientInstance: QueryClient | null = null;

/** Shared query keys — keep here so stores can import without circular hook deps. */
export const CART_QUERY_KEY = ['cart'] as const;
export const WISHLIST_QUERY_KEY = ['wishlist'] as const;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient();
  }
  return queryClientInstance;
}

/** Called by QueryProvider to register the real client instance. */
export function setQueryClient(client: QueryClient): void {
  queryClientInstance = client;
}

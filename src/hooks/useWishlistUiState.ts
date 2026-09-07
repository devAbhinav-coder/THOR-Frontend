import { useWishlistStore } from "@/store/useWishlistStore";
import { useClientMounted } from "./useClientMounted";

/**
 * Wishlist heart state safe for SSR.
 * Reads synchronously from useWishlistStore for instant 0ms UI reactivity.
 */
export function useWishlistUiState(productId: string): boolean {
  const mounted = useClientMounted();
  const inWishlist = useWishlistStore((s) => Boolean(s.wishlistSet[productId]));
  if (!mounted || !productId) return false;
  return inWishlist;
}

/** True once it is safe to render wishlist-dependent UI. */
export function useWishlistUiReady(): boolean {
  return useClientMounted();
}

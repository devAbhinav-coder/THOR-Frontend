import { useWishlistStore } from "@/store/useWishlistStore";
import { useClientMounted } from "./useClientMounted";
import type { Product } from "@/types";

/** Stable empty reference — same server/client snapshot while deferring persist rehydration. */
const EMPTY_WISHLIST: Product[] = [];

/**
 * Wishlist heart state safe for SSR.
 * Waits for client mount + zustand persist rehydration before reading products.
 */
export function useWishlistUiState(productId: string): boolean {
  const mounted = useClientMounted();
  const hasHydrated = useWishlistStore((s) => s._hasHydrated);
  const ready = mounted && hasHydrated;
  const products = useWishlistStore((s) => (ready ? s.products : EMPTY_WISHLIST));
  if (!ready) return false;
  return products.some((p) => p._id === productId);
}

/** True once it is safe to render wishlist-dependent UI. */
export function useWishlistUiReady(): boolean {
  const mounted = useClientMounted();
  const hasHydrated = useWishlistStore((s) => s._hasHydrated);
  return mounted && hasHydrated;
}

import { usePremiumWishlistStore } from "@/store/usePremiumWishlistStore";
import { useClientMounted } from "./useClientMounted";

const EMPTY_SLUGS: string[] = [];

/** Slug heart state safe for SSR — waits for mount + persist rehydration. */
export function usePremiumWishlistUiState(slug: string): boolean {
  const mounted = useClientMounted();
  const hasHydrated = usePremiumWishlistStore((s) => s._hasHydrated);
  const ready = mounted && hasHydrated;
  const slugs = usePremiumWishlistStore((s) => (ready ? s.slugs : EMPTY_SLUGS));
  if (!ready) return false;
  return slugs.includes(slug);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

let markPremiumWishlistHydrated: () => void;

interface PremiumWishlistState {
  slugs: string[];
  _hasHydrated: boolean;
  toggle: (slug: string, productName?: string) => void;
  isSaved: (slug: string) => boolean;
}

export const usePremiumWishlistStore = create<PremiumWishlistState>()(
  persist(
    (set, get) => {
      markPremiumWishlistHydrated = () => set({ _hasHydrated: true });
      return {
        slugs: [],
        _hasHydrated: false,

        isSaved: (slug) => get().slugs.includes(slug),

        toggle: (slug, productName) => {
          const wasSaved = get().isSaved(slug);
          set((state) => ({
            slugs: wasSaved ?
              state.slugs.filter((s) => s !== slug)
            : [...state.slugs, slug],
          }));
          const label = productName ? productName : "Premium piece";
          toast.success(
            wasSaved ? `${label} removed from wishlist` : `${label} saved to wishlist`,
            { icon: wasSaved ? undefined : "✦" },
          );
        },
      };
    },
    {
      name: "premium-wishlist",
      partialize: (state) => ({ slugs: state.slugs }),
      onRehydrateStorage: () => () => {
        markPremiumWishlistHydrated?.();
      },
    },
  ),
);

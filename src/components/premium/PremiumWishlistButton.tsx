"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremiumWishlistUiState } from "@/hooks/usePremiumWishlistUiState";
import { usePremiumWishlistStore } from "@/store/usePremiumWishlistStore";
import { useWishlistUiState } from "@/hooks/useWishlistUiState";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import toast from "react-hot-toast";
import type { Product } from "@/types";

type Props = {
  slug: string;
  productName: string;
  /** When set, uses backend wishlist (MongoDB product id). */
  productId?: string;
  product?: Product;
  size?: "sm" | "md";
  className?: string;
  variant?: "default" | "hero";
  onClick?: (e: React.MouseEvent) => void;
};

export default function PremiumWishlistButton({
  slug,
  productName,
  productId,
  product,
  size = "md",
  className,
  variant = "default",
  onClick,
}: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const usesBackend = Boolean(productId && productId !== slug);
  const inBackendWishlist = useWishlistUiState(productId ?? "");
  const inLocalWishlist = usePremiumWishlistUiState(slug);
  const inWishlist = usesBackend ? inBackendWishlist : inLocalWishlist;
  const toggleLocal = usePremiumWishlistStore((s) => s.toggle);
  const toggleBackend = useWishlistStore((s) => s.toggleWishlist);

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type='button'
      onClick={async (e) => {
        onClick?.(e);
        e.preventDefault();
        e.stopPropagation();
        if (usesBackend && productId) {
          if (!isAuthenticated) {
            toast.error("Sign in to save to wishlist");
            router.push(
              loginUrlWithRedirect(
                window.location.pathname + window.location.search,
              ),
            );
            return;
          }
          await toggleBackend(productId, product);
          return;
        }
        toggleLocal(slug, productName);
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full shadow-md transition-all",
        dim,
        variant === "hero" ?
          inWishlist ?
            "bg-brand-600 text-white"
          : "bg-white/90 text-gray-600 hover:bg-white hover:text-brand-600"
        : inWishlist ?
          "bg-brand-600 text-white scale-105"
        : "bg-white/90 text-gray-500 hover:bg-white hover:text-brand-600",
        className,
      )}
      aria-label={
        inWishlist ?
          `Remove ${productName} from wishlist`
        : `Add ${productName} to wishlist`
      }
      aria-pressed={inWishlist}
    >
      <Heart className={cn(icon, inWishlist && "fill-current")} />
    </button>
  );
}

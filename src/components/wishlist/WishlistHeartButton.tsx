"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWishlistUiReady,
  useWishlistUiState,
} from "@/hooks/useWishlistUiState";

type Props = {
  productId: string;
  productName: string;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
};

/** SSR-safe wishlist heart — identical shell until client mount, then live state. */
export default function WishlistHeartButton({
  productId,
  productName,
  onToggle,
  className,
}: Props) {
  const ready = useWishlistUiReady();
  const inWishlist = useWishlistUiState(productId);

  const shellClass = cn(
    "absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors",
    className,
  );

  if (!ready) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(shellClass, "text-gray-500 hover:text-brand-600")}
        aria-label={`Add ${productName} to wishlist`}
        aria-pressed={false}
      >
        <Heart className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        shellClass,
        inWishlist ? "text-brand-600" : "text-gray-500 hover:text-brand-600",
      )}
      aria-label={
        inWishlist ?
          `Remove ${productName} from wishlist`
        : `Add ${productName} to wishlist`
      }
      aria-pressed={inWishlist}
    >
      <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
    </button>
  );
}

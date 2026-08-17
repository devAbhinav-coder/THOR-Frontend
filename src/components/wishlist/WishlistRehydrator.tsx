"use client";

import { useEffect } from "react";
import { rehydrateWishlistStore } from "@/store/useWishlistStore";

/** Loads wishlist from localStorage after mount — keeps SSR HTML stable. */
export default function WishlistRehydrator() {
  useEffect(() => {
    rehydrateWishlistStore();
  }, []);
  return null;
}

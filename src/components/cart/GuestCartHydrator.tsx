"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

/** Restores guest bag badge/count from localStorage after refresh. */
export default function GuestCartHydrator() {
  const hasSessionChecked = useAuthStore((s) => s.hasSessionChecked);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    if (!hasSessionChecked || isAuthenticated) return;
    void fetchCart();
  }, [hasSessionChecked, isAuthenticated, fetchCart]);

  return null;
}

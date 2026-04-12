import { useMemo } from "react";
import { usePathname } from "next/navigation";

/** Booleans for store shell nav highlights (mobile bottom + desktop patterns). */
export type StoreNavActive = {
  home: boolean;
  shop: boolean;
  gifting: boolean;
  cart: boolean;
  orders: boolean;
  userHub: boolean;
};

export function getStoreNavActive(pathname: string): StoreNavActive {
  return {
    home: pathname === "/",
    shop: pathname.startsWith("/shop"),
    gifting: pathname.startsWith("/gifting"),
    cart: pathname.startsWith("/cart"),
    orders: pathname.startsWith("/dashboard/orders"),
    userHub: pathname === "/dashboard" || pathname === "/auth/login",
  };
}

export function useStoreNavActive(): StoreNavActive {
  const pathname = usePathname();
  return useMemo(() => getStoreNavActive(pathname), [pathname]);
}

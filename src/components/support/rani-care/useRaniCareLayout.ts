import { usePathname } from "next/navigation";
import {
  isStoreProductDetailPath,
  isStoreShopListingPath,
} from "@/lib/storeRoutes";

/** Match store bottom tab bar visibility in Navbar. */
export function useRaniCareLayout() {
  const pathname = usePathname();
  const hasMobileBottomNav =
    pathname !== "/cart" &&
    !pathname.startsWith("/checkout") &&
    !isStoreProductDetailPath(pathname) &&
    !isStoreShopListingPath(pathname);

  return { hasMobileBottomNav };
}

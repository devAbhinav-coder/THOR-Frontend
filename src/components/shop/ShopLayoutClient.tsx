"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import ShopClient from "@/components/shop/ShopClient";
import { ShopFilterPanelProvider } from "@/components/shop/ShopFilterPanelContext";

function isShopListingPath(pathname: string): boolean {
  if (pathname === "/shop") return true;
  if (pathname === "/shop/collections") return true;
  return pathname.startsWith("/shop/category/") || pathname.startsWith("/shop/collections/");
}

export default function ShopLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isListing = isShopListingPath(pathname);

  if (!isListing) {
    return <>{children}</>;
  }

  return (
    <ShopFilterPanelProvider>
      <Suspense fallback={null}>
        <ShopClient>
          {children}
        </ShopClient>
      </Suspense>
    </ShopFilterPanelProvider>
  );
}

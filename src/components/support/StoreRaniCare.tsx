"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const RaniCareAssistant = dynamic(
  () => import("@/components/support/RaniCareAssistant"),
  { ssr: false, loading: () => null },
);

function hideRaniCareOnPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

/** Client-only shell so `next/dynamic` with `ssr: false` is not used from a Server Component layout. */
export function StoreRaniCare() {
  const pathname = usePathname();
  if (hideRaniCareOnPath(pathname)) return null;
  return <RaniCareAssistant />;
}

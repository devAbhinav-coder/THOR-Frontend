"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const RaniCareAssistant = dynamic(
  () => import("@/components/support/RaniCareAssistant"),
  { ssr: false, loading: () => null },
);

/** Client-only shell so `next/dynamic` with `ssr: false` is not used from a Server Component layout. */
export function StoreRaniCare() {
  const pathname = usePathname();

  if (!pathname?.startsWith("/dashboard")) {
    return null;
  }

  return <RaniCareAssistant />;
}

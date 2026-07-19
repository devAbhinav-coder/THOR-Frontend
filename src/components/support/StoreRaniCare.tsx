"use client";

import dynamic from "next/dynamic";

const RaniCareAssistant = dynamic(
  () => import("@/components/support/RaniCareAssistant"),
  { ssr: false, loading: () => null },
);

/** Client-only shell so `next/dynamic` with `ssr: false` is not used from a Server Component layout. */
export function StoreRaniCare() {
  return <RaniCareAssistant />;
}

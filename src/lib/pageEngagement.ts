import { env } from "@/lib/env";
import { getShopSessionKey } from "@/lib/shopSession";
import { useAuthStore } from "@/store/useAuthStore";
import { readPdpEngagementContext } from "@/lib/pdpEngagementContext";
import { getGuestActivityEmail } from "@/lib/guestActivityIdentity";

export function computeScrollPct(): number {
  if (typeof window === "undefined") return 0;
  const doc = document.documentElement;
  const height = doc.scrollHeight - doc.clientHeight;
  if (height <= 0) return 100;
  const scrollTop = window.scrollY || doc.scrollTop;
  return Math.min(100, Math.round((scrollTop / height) * 100));
}

export function flushPageEngagement(input: {
  path: string;
  startedAt: number;
  maxScrollPct: number;
}): void {
  if (typeof window === "undefined") return;
  const sessionKey = getShopSessionKey();
  if (!sessionKey) return;

  const durationMs = Date.now() - input.startedAt;
  if (durationMs < 500) return;

  const path = input.path || "/";
  const pdp =
    path.startsWith("/shop/") || path.startsWith("/premium/") ?
      readPdpEngagementContext()
    : {};

  const userId = useAuthStore.getState().user?._id;
  const guestEmail = userId ? undefined : getGuestActivityEmail();
  const payload = {
    sessionKey,
    path,
    durationMs,
    maxScrollPct: Math.min(100, Math.max(0, input.maxScrollPct)),
    ...(pdp.name ? { productName: pdp.name } : {}),
    ...(userId ? { userId } : {}),
    ...(guestEmail ? { guestEmail } : {}),
  };

  const url = `${env.NEXT_PUBLIC_API_URL}/storefront/page-engagement`;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const ok = navigator.sendBeacon(
      url,
      new Blob([body], { type: "application/json" }),
    );
    if (ok) return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "include",
  }).catch(() => {});
}

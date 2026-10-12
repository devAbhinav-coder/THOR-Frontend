import { env } from "@/lib/env";
import { getShopSessionKey } from "@/lib/shopSession";
import { useAuthStore } from "@/store/useAuthStore";
import { getGuestActivityEmail } from "@/lib/guestActivityIdentity";
import { hasAnalyticsConsent } from "@/lib/cookieConsent";

function createGaEventId(eventName: string): string {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID ?
      crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  return `ga_${eventName}_${random}`;
}

function summarizeItems(params: Record<string, unknown>): {
  itemCount?: number;
  itemSummary?: string;
} {
  const items = params.items;
  if (!Array.isArray(items) || !items.length) return {};
  const names = items
    .slice(0, 3)
    .map((it) => {
      if (it && typeof it === "object" && "item_name" in it) {
        return String((it as { item_name?: string }).item_name ?? "");
      }
      return "";
    })
    .filter(Boolean);
  return {
    itemCount: items.length,
    itemSummary: names.join(", ").slice(0, 400),
  };
}

/** First-party GA4 mirror for admin (alongside Google’s GA property). */
export function mirrorGaEvent(
  eventName: string,
  params: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  const sessionKey = getShopSessionKey();
  if (!sessionKey) return;

  const userId = useAuthStore.getState().user?._id;
  const guestEmail = userId ? undefined : getGuestActivityEmail();
  const { itemCount, itemSummary } = summarizeItems(params);

  const payload = {
    eventName,
    eventId: createGaEventId(eventName),
    sessionKey,
    path: window.location.pathname || "/",
    ...(userId ? { userId } : {}),
    ...(guestEmail ? { guestEmail } : {}),
    ...(params.value != null ? { value: Number(params.value) } : {}),
    ...(params.currency ? { currency: String(params.currency) } : {}),
    ...(params.transaction_id ?
      { transactionId: String(params.transaction_id) }
    : {}),
    ...(params.search_term ?
      { searchTerm: String(params.search_term) }
    : {}),
    ...(itemCount != null ? { itemCount } : {}),
    ...(itemSummary ? { itemSummary } : {}),
  };

  const url = `${env.NEXT_PUBLIC_API_URL}/storefront/ga-event`;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const ok = navigator.sendBeacon(
      url,
      new Blob([body], { type: "application/json" }),
    );
    if (ok) return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "include",
  }).catch(() => {});
}

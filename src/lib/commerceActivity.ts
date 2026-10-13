import { storefrontApi } from "@/lib/api";
import { getShopSessionKey } from "@/lib/shopSession";
import { useAuthStore } from "@/store/useAuthStore";
import { getGuestActivityEmail } from "@/lib/guestActivityIdentity";

export type CommerceActivitySource =
  | "pdp"
  | "wishlist"
  | "card"
  | "cart"
  | "gifting"
  | "search"
  | "checkout"
  | "premium"
  | "unknown";

export type CommerceActivityEvent =
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_cleared"
  | "cart_view"
  | "wishlist_add"
  | "wishlist_remove"
  | "checkout_page_open"
  | "checkout_start"
  | "search"
  | "purchase"
  | "session_exit";

type Payload = {
  eventType: CommerceActivityEvent;
  path?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  variantSku?: string;
  quantity?: number;
  source?: CommerceActivitySource;
  searchQuery?: string;
  orderId?: string;
  orderNumber?: string;
  value?: number;
};

function activityIdentity() {
  const userId = useAuthStore.getState().user?._id;
  const guestEmail =
    userId ? undefined : getGuestActivityEmail();
  return { userId, guestEmail };
}

const addToCartDedupeMs = 2500;
let lastAddToCartKey = "";
let lastAddToCartAt = 0;

/** Best-effort storefront activity log for admin analytics (guest + logged-in). */
export function recordCommerceActivity(payload: Payload): void {
  if (typeof window === "undefined") return;
  const sessionKey = getShopSessionKey();
  if (!sessionKey) return;
  if (payload.eventType === "add_to_cart") {
    const dedupeKey = `${sessionKey}:${payload.productId ?? ""}:${payload.variantSku ?? ""}:${payload.quantity ?? 1}`;
    const now = Date.now();
    if (
      dedupeKey === lastAddToCartKey &&
      now - lastAddToCartAt < addToCartDedupeMs
    ) {
      return;
    }
    lastAddToCartKey = dedupeKey;
    lastAddToCartAt = now;
  }
  const { userId, guestEmail } = activityIdentity();
  const path =
    payload.path ??
    (typeof window !== "undefined" ? window.location.pathname : undefined);
  storefrontApi
    .recordCommerceEvent({
      ...payload,
      sessionKey,
      path,
      userId,
      guestEmail,
    })
    .catch(() => {});
}

export function recordSearchActivity(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  recordCommerceActivity({
    eventType: "search",
    searchQuery: q,
    source: "search",
  });
}

export function currentCommercePath(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.pathname || "/";
}

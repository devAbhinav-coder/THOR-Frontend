import { Product } from "@/types";
import {
  getMetaCatalogItemId,
  type MetaCatalogVariantRef,
} from "@/lib/metaCatalogId";
import { env } from "@/lib/env";
import { getStoredMarketingAttribution } from "@/lib/marketingAttribution";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      initialized?: boolean;
    };
  }
}

type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddToWishlist";

type MetaEventData = Record<string, unknown>;

function createEventId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${random}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

export function getMetaBrowserIdentifiers(): {
  fbp?: string;
  fbc?: string;
} {
  const fbp = readCookie("_fbp");
  const cookieFbc = readCookie("_fbc");
  if (cookieFbc) return { fbp, fbc: cookieFbc };

  const attribution = getStoredMarketingAttribution();
  if (!attribution?.fbclid) return { fbp };
  const capturedAt = attribution.capturedAt
    ? new Date(attribution.capturedAt).getTime()
    : Date.now();
  const timestamp = Number.isFinite(capturedAt) ? capturedAt : Date.now();
  return { fbp, fbc: `fb.1.${timestamp}.${attribution.fbclid}` };
}

function relayToConversionsApi(
  eventName: MetaEventName,
  eventId: string,
  customData: MetaEventData,
): void {
  if (typeof window === "undefined") return;
  const identifiers = getMetaBrowserIdentifiers();

  void fetch(`${env.NEXT_PUBLIC_API_URL}/storefront/meta-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      customData,
      ...identifiers,
    }),
    keepalive: true,
    credentials: "include",
  }).catch(() => {
    // Analytics must never interrupt shopping.
  });
}

function trackMatchedEvent(
  eventName: MetaEventName,
  customData: MetaEventData = {},
  prefix = eventName.toLowerCase(),
): string {
  const eventId = createEventId(prefix);
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }
  relayToConversionsApi(eventName, eventId, customData);
  return eventId;
}

function metaProductPayload(
  product: Product,
  variant: MetaCatalogVariantRef | undefined,
  quantity: number,
  priceOverride?: number,
) {
  const itemId = getMetaCatalogItemId(product._id, variant);
  const unitPrice = priceOverride ?? product.price;

  return {
    content_name: product.name,
    content_ids: [itemId],
    content_type: "product",
    value: unitPrice * quantity,
    currency: "INR",
    contents: [
      {
        id: itemId,
        quantity,
        item_price: unitPrice,
      },
    ],
  };
}

export const initPixel = () => {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!META_PIXEL_ID) return;
  if (!window.fbq.initialized) {
    window.fbq("init", META_PIXEL_ID);
    window.fbq.initialized = true;
  }
};

export const trackPageView = () => {
  trackMatchedEvent("PageView", {}, "pv");
};

export const trackViewContent = (
  product: Product,
  variant?: MetaCatalogVariantRef,
) => {
  const payload = metaProductPayload(product, variant, 1, product.price);
  trackMatchedEvent("ViewContent", payload, `vc_${payload.content_ids[0]}`);
};

export const trackAddToCart = (
  product: Product,
  quantity: number = 1,
  priceOverride?: number,
  variant?: MetaCatalogVariantRef,
) => {
  const payload = metaProductPayload(product, variant, quantity, priceOverride);
  trackMatchedEvent("AddToCart", payload, `atc_${payload.content_ids[0]}`);
};

export const trackPurchase = (order: any) => {
  if (typeof window === "undefined" || !window.fbq) return;

  const contents =
    order.items?.map((item: any) => {
      const productObj =
        typeof item.product === "object" && item.product ? item.product : null;
      const productId =
        productObj?._id ||
        productObj?.id ||
        (typeof item.product === "string" ? item.product : undefined);

      const itemId = getMetaCatalogItemId(productId, item.variant);

      return {
        id: itemId,
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      };
    }) || [];

  const contentIds = contents.map((c: { id: string }) => c.id);

  window.fbq(
    "track",
    "Purchase",
    {
      content_ids: contentIds,
      content_type: "product",
      value: order.totalAmount || order.total || order.amount || 0,
      currency: order.currency || "INR",
      num_items: order.items?.length || 1,
      contents,
    },
    { eventID: `order_${order._id || order.id}` },
  );
};

export const trackInitiateCheckout = (
  cartOrItemValue: number = 0,
  numItems: number = 1,
) => {
  trackMatchedEvent(
    "InitiateCheckout",
    {
      value: cartOrItemValue,
      currency: "INR",
      num_items: numItems,
    },
    "ic",
  );
};

export const trackAddToWishlist = (
  product: Product,
  variant?: MetaCatalogVariantRef,
) => {
  const payload = metaProductPayload(product, variant, 1, product.price);
  trackMatchedEvent("AddToWishlist", payload, `atw_${payload.content_ids[0]}`);
};

export const trackSearch = (searchQuery: string) => {
  if (!searchQuery.trim()) return;

  trackMatchedEvent(
    "Search",
    { search_string: searchQuery.trim().slice(0, 300) },
    "search",
  );
};

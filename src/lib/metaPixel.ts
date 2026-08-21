import { Product } from "@/types";
import {
  getMetaCatalogItemId,
  type MetaCatalogVariantRef,
} from "@/lib/metaCatalogId";
import { env } from "@/lib/env";
import {
  captureMarketingAttributionFromUrl,
  getStoredMarketingAttribution,
} from "@/lib/marketingAttribution";
import { useAuthStore } from "@/store/useAuthStore";

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
  | "AddToWishlist"
  | "AddPaymentInfo"
  | "CompleteRegistration"
  | "Contact";

type MetaEventData = Record<string, unknown>;

export type MetaUserDataInput = {
  email?: string;
  phone?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

const CAPI_RELAY_DELAY_MS = 50;
const FBP_WAIT_MS = 900;
const FBP_POLL_MS = 50;

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

function splitFullName(name?: string): { firstName?: string; lastName?: string } {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function formatPhoneForMetaBrowser(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (/^[6-9]\d{9}$/.test(last10)) return `91${last10}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return undefined;
}

/** Collects user identifiers for advanced matching (browser + CAPI relay). */
export function getMetaUserData(overrides?: MetaUserDataInput): MetaUserDataInput {
  const user = useAuthStore.getState().user;
  const fromUser = splitFullName(user?.name);
  const base: MetaUserDataInput = {
    email: user?.email?.trim().toLowerCase(),
    phone: user?.phone?.trim(),
    externalId: user?._id,
    firstName: fromUser.firstName,
    lastName: fromUser.lastName,
  };

  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(overrides ?? {}).filter(([, value]) => Boolean(value)),
    ),
  };
}

function buildAdvancedMatchingParams(
  userData?: MetaUserDataInput,
): Record<string, string> | undefined {
  const data = userData ?? getMetaUserData();
  const params: Record<string, string> = {};

  if (data.email) params.em = data.email.trim().toLowerCase();
  const phone = data.phone ? formatPhoneForMetaBrowser(data.phone) : undefined;
  if (phone) params.ph = phone;
  if (data.externalId) params.external_id = String(data.externalId);
  if (data.firstName) params.fn = data.firstName.trim();
  if (data.lastName) params.ln = data.lastName.trim();
  if (data.city) params.ct = data.city.trim();
  if (data.state) params.st = data.state.trim();
  if (data.zip) params.zp = data.zip.trim();
  if (data.country) {
    params.country =
      data.country.trim().toLowerCase() === "india" ?
        "in"
      : data.country.trim().slice(0, 2).toLowerCase();
  }

  return Object.keys(params).length ? params : undefined;
}

function waitForFbpCookie(): Promise<string | undefined> {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  const existing = readCookie("_fbp");
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const fbp = readCookie("_fbp");
      if (fbp || Date.now() - started >= FBP_WAIT_MS) {
        resolve(fbp);
        return;
      }
      window.setTimeout(tick, FBP_POLL_MS);
    };
    window.setTimeout(tick, FBP_POLL_MS);
  });
}

export function getMetaBrowserIdentifiers(): {
  fbp?: string;
  fbc?: string;
} {
  captureMarketingAttributionFromUrl();

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
  userData?: MetaUserDataInput,
): void {
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    void waitForFbpCookie().then(() => {
      const identifiers = getMetaBrowserIdentifiers();
      const resolvedUserData = getMetaUserData(userData);
      const payload = {
        eventName,
        eventId,
        eventSourceUrl: window.location.href.split("#")[0],
        customData,
        ...identifiers,
        ...(resolvedUserData.email ? { email: resolvedUserData.email } : {}),
        ...(resolvedUserData.phone ? { phone: resolvedUserData.phone } : {}),
        ...(resolvedUserData.externalId ?
          { externalId: String(resolvedUserData.externalId) }
        : {}),
        ...(resolvedUserData.firstName ?
          { firstName: resolvedUserData.firstName }
        : {}),
        ...(resolvedUserData.lastName ? { lastName: resolvedUserData.lastName } : {}),
        ...(resolvedUserData.city ? { city: resolvedUserData.city } : {}),
        ...(resolvedUserData.state ? { state: resolvedUserData.state } : {}),
        ...(resolvedUserData.zip ? { zip: resolvedUserData.zip } : {}),
        ...(resolvedUserData.country ? { country: resolvedUserData.country } : {}),
      };

      void fetch(`${env.NEXT_PUBLIC_API_URL}/storefront/meta-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "include",
      }).catch(() => {
        // Analytics must never interrupt shopping.
      });
    });
  }, CAPI_RELAY_DELAY_MS);
}

function trackMatchedEvent(
  eventName: MetaEventName,
  customData: MetaEventData = {},
  prefix = eventName.toLowerCase(),
  userData?: MetaUserDataInput,
): string {
  const eventId = createEventId(prefix);
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }
  relayToConversionsApi(eventName, eventId, customData, userData);
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

export const initPixel = (userData?: MetaUserDataInput) => {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!META_PIXEL_ID) return;

  captureMarketingAttributionFromUrl();
  const advancedMatching = buildAdvancedMatchingParams(userData);

  if (!window.fbq.initialized) {
    if (advancedMatching) {
      window.fbq("init", META_PIXEL_ID, advancedMatching);
    } else {
      window.fbq("init", META_PIXEL_ID);
    }
    window.fbq.initialized = true;
    return;
  }

  if (advancedMatching) {
    window.fbq("init", META_PIXEL_ID, advancedMatching);
  }
};

/** Re-apply advanced matching after login or checkout form updates. */
export const refreshMetaAdvancedMatching = (userData?: MetaUserDataInput) => {
  initPixel(userData);
};

export const trackPageView = (userData?: MetaUserDataInput) => {
  trackMatchedEvent("PageView", {}, "pv", userData);
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

  const shipping = order.shippingAddress;
  refreshMetaAdvancedMatching(
    buildCheckoutMetaUserData({
      email: order.email || order.user?.email,
      name: shipping?.name,
      phone: shipping?.phone,
      city: shipping?.city,
      state: shipping?.state,
      pincode: shipping?.pincode,
      country: shipping?.country || "India",
      externalId: order.user?._id,
    }),
  );

  const eventId = `order_${order._id || order.id}`;
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
  const customData = {
    content_ids: contentIds,
    content_type: "product",
    value: order.totalAmount || order.total || order.amount || 0,
    currency: order.currency || "INR",
    num_items: order.items?.length || 1,
    contents,
  };

  window.fbq("track", "Purchase", customData, { eventID: eventId });
};

export const trackInitiateCheckout = (
  cartOrItemValue: number = 0,
  numItems: number = 1,
  userData?: MetaUserDataInput,
) => {
  trackMatchedEvent(
    "InitiateCheckout",
    {
      value: cartOrItemValue,
      currency: "INR",
      num_items: numItems,
    },
    "ic",
    userData,
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

export const trackAddPaymentInfo = (userData?: MetaUserDataInput) => {
  trackMatchedEvent("AddPaymentInfo", {}, "api", userData);
};

export const trackCompleteRegistration = (userData?: MetaUserDataInput) => {
  trackMatchedEvent(
    "CompleteRegistration",
    { status: "completed" },
    "reg",
    userData,
  );
};

export const trackContact = (userData?: MetaUserDataInput) => {
  trackMatchedEvent("Contact", {}, "contact", userData);
};

/** Build user data from checkout address form values. */
export function buildCheckoutMetaUserData(input: {
  email?: string;
  name?: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  externalId?: string;
}): MetaUserDataInput {
  const { firstName, lastName } = splitFullName(input.name);
  return getMetaUserData({
    email: input.email,
    phone: input.phone,
    externalId: input.externalId,
    firstName,
    lastName,
    city: input.city,
    state: input.state,
    zip: input.pincode,
    country: input.country || "India",
  });
}

import { Product } from "@/types";
import {
  getMetaCatalogItemId,
  type MetaCatalogVariantRef,
} from "@/lib/metaCatalogId";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq: any;
  }
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
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "PageView");
};

export const trackViewContent = (
  product: Product,
  variant?: MetaCatalogVariantRef,
) => {
  if (typeof window === "undefined" || !window.fbq) return;

  const payload = metaProductPayload(product, variant, 1, product.price);
  const eventId = `vc_${payload.content_ids[0]}_${Date.now()}`;

  window.fbq("track", "ViewContent", payload, { eventID: eventId });
};

export const trackAddToCart = (
  product: Product,
  quantity: number = 1,
  priceOverride?: number,
  variant?: MetaCatalogVariantRef,
) => {
  if (typeof window === "undefined" || !window.fbq) return;

  const payload = metaProductPayload(product, variant, quantity, priceOverride);
  const eventId = `atc_${payload.content_ids[0]}_${Date.now()}`;

  window.fbq("track", "AddToCart", payload, { eventID: eventId });
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
  if (typeof window === "undefined" || !window.fbq) return;

  const eventId = `ic_${Date.now()}`;

  window.fbq(
    "track",
    "InitiateCheckout",
    {
      value: cartOrItemValue,
      currency: "INR",
      num_items: numItems,
    },
    { eventID: eventId },
  );
};

export const trackAddToWishlist = (
  product: Product,
  variant?: MetaCatalogVariantRef,
) => {
  if (typeof window === "undefined" || !window.fbq) return;

  const payload = metaProductPayload(product, variant, 1, product.price);
  const eventId = `atw_${payload.content_ids[0]}_${Date.now()}`;

  window.fbq("track", "AddToWishlist", payload, { eventID: eventId });
};

export const trackSearch = (searchQuery: string) => {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!searchQuery.trim()) return;

  window.fbq("track", "Search", {
    search_string: searchQuery,
  });
};

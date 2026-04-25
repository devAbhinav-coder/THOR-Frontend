import { Product } from "@/types";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Define the global window object to include fbq
declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Ensures the pixel is available and initialized.
 * Guarded to prevent double initialization.
 */
export const initPixel = () => {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!META_PIXEL_ID) return;
  if (!window.fbq.initialized) {
    window.fbq("init", META_PIXEL_ID);
    window.fbq.initialized = true;
  }
};

/**
 * Tracks a standard PageView event.
 */
export const trackPageView = () => {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "PageView");
};

/**
 * Tracks the ViewContent event for a product page.
 */
export const trackViewContent = (product: Product) => {
  if (typeof window === "undefined" || !window.fbq) return;
  
  const eventId = `vc_${product._id}_${Date.now()}`;

  window.fbq(
    "track", 
    "ViewContent", 
    {
      content_name: product.name,
      content_ids: [product._id],
      content_type: "product_group",
      value: product.price,
      currency: "INR", // Adjust based on your default store currency
      contents: [
        {
          id: product._id,
          quantity: 1,
          item_price: product.price,
        }
      ]
    },
    { eventID: eventId }
  );
};

/**
 * Tracks the AddToCart event.
 */
export const trackAddToCart = (product: Product, quantity: number = 1, priceOverride?: number) => {
  if (typeof window === "undefined" || !window.fbq) return;
  
  const value = (priceOverride || product.price) * quantity;
  const eventId = `atc_${product._id}_${Date.now()}`;
  
  window.fbq(
    "track", 
    "AddToCart", 
    {
      content_name: product.name,
      content_ids: [product._id],
      content_type: "product_group",
      value: value,
      currency: "INR",
      contents: [
        {
          id: product._id,
          quantity: quantity,
          item_price: priceOverride || product.price,
        }
      ]
    },
    { eventID: eventId }
  );
};

/**
 * Tracks the Purchase event on order success.
 * Using 'any' for order since its type might vary, but assuming standard fields.
 */
export const trackPurchase = (order: any) => {
  if (typeof window === "undefined" || !window.fbq) return;
  
  const contentIds = order.items?.map((item: any) => 
    typeof item.product === 'object' ? item.product._id : item.product
  ) || [];

  const contents = order.items?.map((item: any) => {
    const productObj = typeof item.product === 'object' ? item.product : item;
    return {
      id: productObj._id || productObj.id,
      quantity: item.quantity || 1,
      item_price: item.price || 0,
    };
  }) || [];

  window.fbq(
    "track", 
    "Purchase", 
    {
      content_ids: contentIds,
      content_type: "product_group",
      value: order.totalAmount || order.total || order.amount || 0,
      currency: order.currency || "INR",
      num_items: order.items?.length || 1,
      contents: contents,
    },
    { eventID: `order_${order._id || order.id}` }
  );
};

/**
 * Tracks the InitiateCheckout event.
 */
export const trackInitiateCheckout = (cartOrItemValue: number = 0, numItems: number = 1) => {
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
    { eventID: eventId }
  );
};

/**
 * Tracks the AddToWishlist event.
 */
export const trackAddToWishlist = (product: Product) => {
  if (typeof window === "undefined" || !window.fbq) return;
  
  const eventId = `atw_${product._id}_${Date.now()}`;

  window.fbq(
    "track", 
    "AddToWishlist", 
    {
      content_name: product.name,
      content_ids: [product._id],
      content_type: "product_group",
      value: product.price,
      currency: "INR",
      contents: [
        {
          id: product._id,
          quantity: 1,
          item_price: product.price,
        }
      ]
    },
    { eventID: eventId }
  );
};

/**
 * Tracks the Search event.
 */
export const trackSearch = (searchQuery: string) => {
  if (typeof window === "undefined" || !window.fbq) return;
  if (!searchQuery.trim()) return;
  
  window.fbq("track", "Search", {
    search_string: searchQuery,
  });
};

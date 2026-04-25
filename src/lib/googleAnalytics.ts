import { Product, Order } from "@/types";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Utility to safely call gtag and push to dataLayer if they exist.
 */
const trackEvent = (eventName: string, params: Record<string, any>) => {
  // 1. Direct GA4
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
  // 2. GTM DataLayer
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ecommerce: params,
    });
  }
};

/**
 * Tracks the 'view_item' GA4 ecommerce event.
 */
export const trackGaViewItem = (product: Product) => {
  trackEvent("view_item", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category,
        item_brand: "The House of Rani",
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

/**
 * Tracks the 'add_to_cart' GA4 ecommerce event.
 */
export const trackGaAddToCart = (product: Product, quantity: number = 1, priceOverride?: number) => {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: (priceOverride || product.price) * quantity,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category,
        item_brand: "The House of Rani",
        price: priceOverride || product.price,
        quantity,
      },
    ],
  });
};

/**
 * Tracks the 'add_to_wishlist' GA4 ecommerce event.
 */
export const trackGaAddToWishlist = (product: Product) => {
  trackEvent("add_to_wishlist", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.category,
        item_brand: "The House of Rani",
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

/**
 * Tracks the 'begin_checkout' GA4 ecommerce event.
 */
export const trackGaBeginCheckout = (total: number, orderOrCartItems: any[]) => {
  trackEvent("begin_checkout", {
    currency: "INR",
    value: total,
    items: orderOrCartItems.map((item, index) => {
      // Handle both CartItem structures and Order item structures
      const productObj = item.product || item;
      return {
        item_id: productObj._id || productObj.id || "unknown",
        item_name: productObj.name || "Product",
        item_category: productObj.category || "",
        item_brand: "The House of Rani",
        price: item.price || productObj.price || 0,
        quantity: item.quantity || 1,
        index,
      };
    }),
  });
};

/**
 * Tracks the 'purchase' GA4 ecommerce event.
 */
export const trackGaPurchase = (order: any) => {
  trackEvent("purchase", {
    transaction_id: order.orderNumber || order._id,
    value: order.totalAmount || order.total || order.amount || 0,
    tax: order.tax || 0,
    shipping: order.shippingCharge || 0,
    currency: order.currency || "INR",
    coupon: order.couponCode || "",
    items: (order.items || []).map((item: any, index: number) => {
      const productObj = typeof item.product === 'object' ? item.product : item;
      return {
        item_id: productObj._id || productObj.id || "unknown",
        item_name: productObj.name || "Product",
        item_category: productObj.category || "",
        item_brand: "The House of Rani",
        price: item.price || 0,
        quantity: item.quantity || 1,
        index,
      };
    }),
  });
};

/**
 * Tracks the 'search' GA4 standard event.
 */
export const trackGaSearch = (searchTerm: string) => {
  if (!searchTerm.trim()) return;
  trackEvent("search", {
    search_term: searchTerm,
  });
};

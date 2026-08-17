/** Session payload for Buy Now → checkout (not stored in server cart). */
export type BuyNowCheckoutItem = {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variant: {
    size?: string;
    color?: string;
    colorCode?: string;
    sku: string;
    stock?: number;
    price?: number;
  };
  customFieldAnswers?: { label: string; value: string }[];
  maxStock?: number;
};

export const BUY_NOW_SESSION_KEY = "hor_buy_now_checkout_item";

function isValidBuyNowItem(value: unknown): value is BuyNowCheckoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as BuyNowCheckoutItem;
  return (
    Boolean(item.productId) &&
    Boolean(item.variant?.sku) &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
}

/** Read buy-now line from sessionStorage (client only). */
export function readBuyNowFromSession(): BuyNowCheckoutItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUY_NOW_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidBuyNowItem(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBuyNowToSession(item: BuyNowCheckoutItem): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BUY_NOW_SESSION_KEY, JSON.stringify(item));
}

export function clearBuyNowSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUY_NOW_SESSION_KEY);
}

/** True when URL or session indicates an active buy-now checkout. */
export function hasBuyNowCheckoutIntent(search?: string | null): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(search ?? window.location.search);
  if (params.get("buyNow") === "1") return true;
  return readBuyNowFromSession() !== null;
}

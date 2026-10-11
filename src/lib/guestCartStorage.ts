import type { Cart, CartItem } from "@/types";

export const GUEST_CART_STORAGE_KEY = "hor_guest_cart_v1";

export type GuestCartLine = {
  productId: string;
  variant: CartItem["variant"];
  quantity: number;
  customFieldAnswers?: Array<{ label: string; value: string }>;
  /** Snapshot for UI when product object is unavailable */
  productName: string;
  productSlug: string;
  productImage: string;
  isActive: boolean;
  price: number;
};

function isGuestLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== "object") return false;
  const o = value as GuestCartLine;
  return (
    typeof o.productId === "string" &&
    typeof o.variant?.sku === "string" &&
    typeof o.quantity === "number" &&
    o.quantity >= 1
  );
}

export function readGuestCartLines(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isGuestLine);
  } catch {
    return [];
  }
}

export function writeGuestCartLines(lines: GuestCartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!lines.length) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* quota / private mode */
  }
}

export function clearGuestCartStorage(): void {
  writeGuestCartLines([]);
}

export function guestLinesToCart(lines: GuestCartLine[]): Cart {
  const items: CartItem[] = lines.map((line, index) => ({
    cartItemId: `guest-${line.productId}-${line.variant.sku}-${index}`,
    product: line.productId,
    productName: line.productName,
    productSlug: line.productSlug,
    productImage: line.productImage,
    isActive: line.isActive,
    variant: line.variant,
    quantity: line.quantity,
    price: line.price,
    ...(line.customFieldAnswers?.length ?
      { customFieldAnswers: line.customFieldAnswers }
    : {}),
  }));
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    _id: "guest",
    items,
    subtotal,
    discount: 0,
    total: subtotal,
  };
}

export function guestLinesForMergeApi(lines: GuestCartLine[]) {
  return lines.map((line) => ({
    productId: line.productId,
    variant: line.variant,
    quantity: line.quantity,
    ...(line.customFieldAnswers?.length ?
      { customFieldAnswers: line.customFieldAnswers }
    : {}),
  }));
}

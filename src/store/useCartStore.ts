import { create } from 'zustand';
import { Cart, CartItem, Product } from '@/types';
import { cartApi } from '@/lib/api';
import toast from 'react-hot-toast';

/** Survives full page reload / new tab so checkout still sees cart-applied coupon after fetchCart. */
export const CART_APPLIED_COUPON_STORAGE_KEY = 'hor_cart_applied_coupon_code';

function readStoredCouponCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(CART_APPLIED_COUPON_STORAGE_KEY);
    if (s?.trim()) return s.trim();
    const l = localStorage.getItem(CART_APPLIED_COUPON_STORAGE_KEY);
    return l?.trim() ? l.trim() : null;
  } catch {
    return null;
  }
}

function writeStoredCouponCode(code: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      sessionStorage.setItem(CART_APPLIED_COUPON_STORAGE_KEY, code);
      localStorage.setItem(CART_APPLIED_COUPON_STORAGE_KEY, code);
    } else {
      sessionStorage.removeItem(CART_APPLIED_COUPON_STORAGE_KEY);
      localStorage.removeItem(CART_APPLIED_COUPON_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Never wipe stored code while server still shows a discount but we couldn't resolve the
 * string yet (populate lag / race). Only clear when discount is actually gone.
 */
function syncCouponStorage(code: string | null, cart: Cart | null | undefined): void {
  const d = cart?.discount ?? 0;
  if (d <= 0) {
    writeStoredCouponCode(null);
    return;
  }
  if (code) writeStoredCouponCode(code);
}

const addCartInFlight = new Set<string>();

function cartAddKey(productId: string, sku: string, answers?: Array<{ label: string; value: string }>) {
  const a = answers?.length
    ? [...answers].sort((x, y) => x.label.localeCompare(y.label)).map((x) => `${x.label}:${x.value}`).join('|')
    : '';
  return `${productId}:${sku}:${a}`;
}

function normalizeAnswers(a?: Array<{ label: string; value: string }>) {
  if (!a?.length) return [] as Array<{ label: string; value: string }>;
  return [...a].sort((x, y) => x.label.localeCompare(y.label));
}

function answersMatch(
  a?: Array<{ label: string; value: string }>,
  b?: Array<{ label: string; value: string }>,
) {
  const na = normalizeAnswers(a);
  const nb = normalizeAnswers(b);
  if (na.length !== nb.length) return false;
  return na.every((x, i) => x.label === nb[i].label && x.value === nb[i].value);
}

function unitPriceForVariant(product: Product, variantSku: string): number {
  const v = product.variants.find((x) => x.sku === variantSku);
  return v?.price ?? product.price;
}

/**
 * Keeps coupon code in sync whenever we replace `cart` from the API.
 * If the server still applies a discount but `coupon` is not populated (ObjectId / missing),
 * we keep the last known code so checkout preserves cart-applied coupons after `fetchCart`.
 */
function appliedCouponCodeFromCart(
  cart: Cart | null | undefined,
  previous: string | null,
): string | null {
  if (!cart?.items?.length) return null;
  const discount = cart.discount ?? 0;
  if (discount <= 0) return null;

  const raw = cart.coupon;
  if (raw && typeof raw === 'object' && raw !== null && 'code' in raw) {
    const code = (raw as { code?: string }).code;
    if (typeof code === 'string' && code.trim().length > 0) return code.trim();
  }
  // API sometimes returns coupon as unpopulated ObjectId string — keep last known code
  if (typeof raw === 'string' && raw.length > 0 && previous && previous.trim().length > 0) {
    return previous.trim();
  }
  if (previous && previous.trim().length > 0) return previous.trim();
  return null;
}

/** Merge API cart + prior store + sessionStorage + optional fallback (e.g. apply-coupon response). */
function resolveAppliedCouponCode(
  cart: Cart | null | undefined,
  previousCode: string | null,
  fallbackCode?: string | null,
): string | null {
  let code = appliedCouponCodeFromCart(cart, previousCode);
  if (!code && (cart?.discount ?? 0) > 0) {
    code = readStoredCouponCode();
  }
  if (!code && fallbackCode?.trim()) {
    code = fallbackCode.trim();
  }
  syncCouponStorage(code, cart);
  return code;
}

function mergeOptimisticCart(
  previous: Cart | null,
  product: Product,
  variant: CartItem['variant'],
  quantity: number,
  customFieldAnswers?: Array<{ label: string; value: string }>,
): Cart {
  const price = unitPriceForVariant(product, variant.sku);
  const newItem: CartItem = {
    product,
    variant,
    quantity,
    price,
    ...(customFieldAnswers?.length ? { customFieldAnswers } : {}),
  };

  const prevItems = previous?.items ?? [];
  const idx = prevItems.findIndex(
    (it) => it.variant.sku === variant.sku && answersMatch(it.customFieldAnswers, customFieldAnswers),
  );

  let items: CartItem[];
  if (idx >= 0) {
    items = prevItems.map((it, i) =>
      i === idx ? { ...it, quantity: it.quantity + quantity } : it,
    );
  } else {
    items = [...prevItems, newItem];
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = previous?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  return {
    _id: previous?._id ?? 'pending',
    items,
    coupon: previous?.coupon,
    subtotal,
    discount,
    total,
  };
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  appliedCouponCode: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    variant: CartItem['variant'],
    quantity: number,
    customFieldAnswers?: Array<{ label: string; value: string }>,
    /** When set, cart badge + drawer update immediately (then server confirms) */
    product?: Product,
  ) => Promise<void>;
   updateItem: (sku: string, quantity: number) => Promise<void>;
   removeItem: (sku: string) => Promise<void>;
   clearCart: () => Promise<void>;
   applyCoupon: (code: string) => Promise<void>;
   removeCoupon: () => Promise<void>;
   resetCart: () => void;
 }
 
 export const useCartStore = create<CartState>((set, get) => ({
   cart: null,
   isLoading: false,
   itemCount: 0,
   appliedCouponCode: null,
 
   fetchCart: async () => {
     set({ isLoading: true });
     const previousCode = get().appliedCouponCode;
     try {
       const body = await cartApi.get();
       const cart = body.data.cart;
       set({
         cart,
         itemCount: cart?.items?.reduce((acc: number, item: CartItem) => acc + item.quantity, 0) || 0,
         appliedCouponCode: resolveAppliedCouponCode(cart, previousCode),
       });
     } catch {
       // silent fail
     } finally {
       set({ isLoading: false });
     }
   },
 
   addToCart: async (productId, variant, quantity, customFieldAnswers, product) => {
     const key = cartAddKey(productId, variant.sku, customFieldAnswers);
     if (addCartInFlight.has(key)) return;

     const previousCart = get().cart;
     const previousCount = get().itemCount;

     if (product) {
       addCartInFlight.add(key);
       const optimistic = mergeOptimisticCart(
         previousCart,
         product,
         variant,
         quantity,
         customFieldAnswers,
       );
       set({
         cart: optimistic,
         itemCount: optimistic.items.reduce((acc, item) => acc + item.quantity, 0),
       });
     }

     try {
       const body = await cartApi.add({ productId, variant, quantity, customFieldAnswers });
      const cart = body.data.cart;
      set({
        cart,
        itemCount: cart.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
        appliedCouponCode: resolveAppliedCouponCode(cart, get().appliedCouponCode),
      });
      toast.success('Added to cart!');
    } catch (err: unknown) {
      if (product) {
        set({ cart: previousCart, itemCount: previousCount });
      }
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to add to cart');
      throw err;
    } finally {
      if (product) addCartInFlight.delete(key);
    }
  },

   updateItem: async (sku, quantity) => {
    try {
      const body = await cartApi.update(sku, quantity);
      const cart = body.data.cart;
      set({
        cart,
        itemCount: cart.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
        appliedCouponCode: resolveAppliedCouponCode(cart, get().appliedCouponCode),
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update cart');
    }
  },

  removeItem: async (sku) => {
    try {
      const body = await cartApi.remove(sku);
      const cart = body.data.cart;
      set({
        cart,
        itemCount: cart.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
        appliedCouponCode: resolveAppliedCouponCode(cart, get().appliedCouponCode),
      });
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clear();
      writeStoredCouponCode(null);
      set({ cart: null, itemCount: 0, appliedCouponCode: null });
    } catch {
      toast.error('Failed to clear cart');
    }
  },

  applyCoupon: async (code) => {
    try {
      const body = await cartApi.applyCoupon(code);
      const cart = body.data.cart;
      const resolved = (body.data.coupon?.code || code).trim();
      const next =
        resolveAppliedCouponCode(cart, get().appliedCouponCode, resolved) ?? resolved;
      set({ cart, appliedCouponCode: next });
      if ((cart?.discount ?? 0) > 0 && next) writeStoredCouponCode(next);
      toast.success(`Coupon applied. You saved ₹${body.data.coupon.appliedDiscount}.`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Invalid coupon');
      throw err;
    }
  },

  removeCoupon: async () => {
    try {
      const body = await cartApi.removeCoupon();
      const cart = body.data.cart;
      set({
        cart,
        appliedCouponCode: resolveAppliedCouponCode(cart, null),
      });
      toast.success('Coupon removed from your cart.');
    } catch {
      toast.error('Failed to remove coupon');
    }
  },

  resetCart: () => {
    const { cart } = get();
    if (cart) {
      writeStoredCouponCode(null);
      set({ cart: null, itemCount: 0, appliedCouponCode: null });
    }
  },
}));

/** Read session + local backup (used on checkout if Zustand code is missing). */
export function readPersistedCartCouponCode(): string | null {
  return readStoredCouponCode();
}

/** Use when placing an order from cart (not buy-now) so coupon is always sent to the API. */
export function getCartAppliedCouponCodeForOrder(): string | null {
  const { appliedCouponCode, cart } = useCartStore.getState();
  if (appliedCouponCode?.trim()) return appliedCouponCode.trim();
  const raw = cart?.coupon;
  if (raw && typeof raw === 'object' && raw !== null && 'code' in raw) {
    const c = (raw as { code?: string }).code;
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  if ((cart?.discount ?? 0) > 0) return readStoredCouponCode();
  return null;
}

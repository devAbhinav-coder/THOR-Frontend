import { create } from 'zustand';
import { Cart, CartItem, Product } from '@/types';
import { cartApi } from '@/lib/api';
import toast from 'react-hot-toast';

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
     try {
       const body = await cartApi.get();
       const cart = body.data.cart;
       const couponCode =
         typeof cart?.coupon === 'object' && cart?.coupon?.code ? cart.coupon.code : null;
       set({
         cart,
         itemCount: cart?.items?.reduce((acc: number, item: CartItem) => acc + item.quantity, 0) || 0,
         appliedCouponCode: couponCode,
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
      });
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clear();
      set({ cart: null, itemCount: 0 });
    } catch {
      toast.error('Failed to clear cart');
    }
  },

  applyCoupon: async (code) => {
    try {
      const body = await cartApi.applyCoupon(code);
      const cart = body.data.cart;
      set({ cart, appliedCouponCode: body.data.coupon?.code || code });
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
      set({ cart: body.data.cart, appliedCouponCode: null });
      toast.success('Coupon removed from your cart.');
    } catch {
      toast.error('Failed to remove coupon');
    }
  },

  resetCart: () => {
    const { cart } = get();
    if (cart) {
      set({ cart: null, itemCount: 0, appliedCouponCode: null });
    }
  },
}));

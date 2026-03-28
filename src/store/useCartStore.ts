import { create } from 'zustand';
import { Cart, CartItem } from '@/types';
import { cartApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  appliedCouponCode: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variant: CartItem['variant'], quantity: number) => Promise<void>;
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

  addToCart: async (productId, variant, quantity) => {
    set({ isLoading: true });
    try {
      const body = await cartApi.add({ productId, variant, quantity });
      const cart = body.data.cart;
      set({
        cart,
        itemCount: cart.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
      });
      toast.success('Added to cart!');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to add to cart');
      throw err;
    } finally {
      set({ isLoading: false });
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

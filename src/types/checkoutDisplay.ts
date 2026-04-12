import type { CartItem, OrderItem, ProductImage } from "./index";

/** Buy-now session row shaped like a cart line for checkout UI. */
export type BuyNowCheckoutDisplayItem = {
  product: { _id: string; images: ProductImage[] };
  name: string;
  variant: CartItem["variant"];
  quantity: number;
  price: number;
  customFieldAnswers?: { label: string; value: string }[];
};

export type CheckoutDisplayItem =
  | OrderItem
  | CartItem
  | BuyNowCheckoutDisplayItem;

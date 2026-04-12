import type { CartItem, OrderItem } from "@/types";
import type { BuyNowCheckoutDisplayItem, CheckoutDisplayItem } from "@/types/checkoutDisplay";

export type CheckoutRowDisplay = {
  name: string;
  quantity: number;
  price: number;
  variant: { size?: string; color?: string; sku: string };
  thumbUrl: string;
  customFieldAnswers?: { label: string; value: string }[];
};

/** Normalizes order line vs cart line vs buy-now synthetic row for checkout UI. */
export function toCheckoutRowDisplay(
  item: CheckoutDisplayItem,
  existingOrder: boolean,
): CheckoutRowDisplay {
  if (existingOrder) {
    const o = item as OrderItem;
    return {
      name: o.name,
      quantity: o.quantity,
      price: o.price,
      variant: o.variant,
      thumbUrl: o.image,
      customFieldAnswers: o.customFieldAnswers,
    };
  }
  const c = item as CartItem | BuyNowCheckoutDisplayItem;
  const name =
    (c as CartItem).product?.name ?? (c as BuyNowCheckoutDisplayItem).name;
  const thumbUrl =
    (c as CartItem).product?.images?.[0]?.url ??
    (c as BuyNowCheckoutDisplayItem).product?.images?.[0]?.url ??
    "";
  return {
    name,
    quantity: c.quantity,
    price: c.price,
    variant: c.variant,
    thumbUrl,
    customFieldAnswers: c.customFieldAnswers,
  };
}

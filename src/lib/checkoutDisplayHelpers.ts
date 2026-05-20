import type { CartItem, OrderItem } from "@/types";
import type { BuyNowCheckoutDisplayItem, CheckoutDisplayItem } from "@/types/checkoutDisplay";

export type CheckoutRowDisplay = {
  name: string;
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
    (c as CartItem).productName ??// Fallback just in case
    (c as BuyNowCheckoutDisplayItem).name;
  const thumbUrl =
    (c as CartItem).productImage ??
    (c as BuyNowCheckoutDisplayItem).product?.images?.[0]?.url ??
    "";
  
  // Extract stock for quantity caps
  const stock = 
    (c as CartItem).variant?.stock ?? 
    (c as BuyNowCheckoutDisplayItem).variant?.stock ?? 
    (c as BuyNowCheckoutDisplayItem).maxStock;

  return {
    name,
    quantity: c.quantity,
    price: c.price,
    variant: { ...c.variant, stock },
    thumbUrl,
    customFieldAnswers: c.customFieldAnswers,
  };
}

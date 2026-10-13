import type { CartItem, Product } from "@/types";
import { trackAddToCart } from "@/lib/metaPixel";
import { trackGaAddToCart } from "@/lib/googleAnalytics";
import { variantSellPrice } from "@/lib/productPricing";

/** Single place for add-to-cart pixel + GA4 (called once per successful bag add). */
export function notifyCartAddAnalytics(
  product: Product,
  variant: CartItem["variant"],
  quantity: number,
): void {
  const price = variantSellPrice(variant, product);
  trackAddToCart(product, quantity, price, variant);
  trackGaAddToCart(product, quantity, price);
}

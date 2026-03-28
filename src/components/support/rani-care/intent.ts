import type { Intent } from "./types";
import type { Order } from "@/types";

export function detectIntent(input: string): Intent {
  const q = input.toLowerCase().trim();

  if (/\b(cancel|cancellation)\b/.test(q)) return "cancel_help";
  if (
    /\b(my\s+orders?|last\s+orders?|recent\s+orders?|order\s+history|show\s+orders?|list\s+orders?)\b/.test(q)
  )
    return "show_orders";
  if (
    /\b(track|tracking|where\s+is|delivery|shipment|status|awb|dispatch|parcel|courier)\b/.test(q) ||
    /\border\s+status\b/.test(q)
  )
    return "show_orders";

  if (/(return|refund|replace|exchange|wrong item|damaged)/.test(q)) return "returns";
  if (/(ship|delivery|deliver|cod)\b/.test(q)) return "shipping";
  if (/(payment|upi|card|failed|razorpay|charged)/.test(q)) return "payment";
  if (/(coupon|discount|offer|promo)/.test(q)) return "coupon";
  if (/(size|fit|measurement)/.test(q)) return "sizing";
  if (/(privacy|data|personal info)/.test(q)) return "privacy";
  if (/(terms|policy|legal)/.test(q)) return "terms";
  if (/(human|agent|support|call|contact|help me)/.test(q)) return "contact";
  return "general";
}

/** Try to match order number in free text against cached orders */
export function findOrderIdByNumber(text: string, orders: Order[]): string | null {
  const t = text.toUpperCase().replace(/\s+/g, " ").trim();
  for (const o of orders) {
    const num = o.orderNumber.toUpperCase();
    if (num && t.includes(num)) return o._id;
  }
  const m = t.match(/\b[A-Z]{2,}[\w#-]*\d{2,}\b/g);
  if (!m) return null;
  for (const token of m) {
    const hit = orders.find((o) => o.orderNumber.toUpperCase() === token.replace(/#/g, ""));
    if (hit) return hit._id;
  }
  return null;
}

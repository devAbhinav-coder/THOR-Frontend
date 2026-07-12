import type { Order } from "@/types";
import { fuzzyHas, normalizeForIntent } from "./textNormalize";
import type { Intent } from "./types";

export function detectIntent(input: string): Intent {
  const q = normalizeForIntent(input);

  if (fuzzyHas(q, ["cancel", "cancellation", "stop order", "dont want"])) {
    return "cancel_help";
  }
  if (
    fuzzyHas(q, [
      "my order",
      "my orders",
      "last order",
      "recent order",
      "order history",
      "show order",
      "list order",
      "all orders",
      "mera order",
      "mere order",
    ]) ||
    /\borders?\b/.test(q)
  ) {
    return "show_orders";
  }
  if (
    fuzzyHas(q, [
      "track",
      "tracking",
      "where is",
      "delivery status",
      "order status",
      "awb",
      "dispatch",
      "parcel",
      "courier",
      "shipped",
      "kahan hai",
      "kab aayega",
      "kab milega",
      "kidhar",
    ])
  ) {
    return "show_orders";
  }

  if (
    fuzzyHas(q, [
      "return",
      "refund",
      "replace",
      "exchange",
      "wrong item",
      "damaged",
      "defective",
      "wapas",
      "paisa wapas",
    ])
  ) {
    return "returns";
  }
  if (
    fuzzyHas(q, [
      "ship",
      "delivery",
      "deliver",
      "cod",
      "how long",
      "kitne din",
      "pincode",
      "address",
      "bhej",
    ])
  ) {
    return "shipping";
  }
  if (
    fuzzyHas(q, [
      "payment",
      "upi",
      "card",
      "failed",
      "razorpay",
      "charged",
      "debit",
      "paisa kata",
    ])
  ) {
    return "payment";
  }
  if (fuzzyHas(q, ["coupon", "discount", "offer", "promo", "code"])) {
    return "coupon";
  }
  if (
    fuzzyHas(q, [
      "size",
      "fit",
      "measurement",
      "sizing",
      "blouse",
      "2xl",
      "3xl",
      "naap",
    ])
  ) {
    return "sizing";
  }
  if (fuzzyHas(q, ["privacy", "data", "personal info"])) {
    return "privacy";
  }
  if (fuzzyHas(q, ["terms", "policy", "legal", "tos"])) {
    return "terms";
  }
  if (
    fuzzyHas(q, [
      "human",
      "agent",
      "support",
      "call",
      "contact",
      "help me",
      "talk",
      "speak",
      "phone",
      "email",
    ])
  ) {
    return "contact";
  }
  return "general";
}

export type IntentSuggestion = {
  intent: Intent;
  label: string;
  actionValue: string;
};

const INTENT_HINTS: { intent: Intent; keywords: string[]; label: string; actionValue: string }[] = [
  {
    intent: "show_orders",
    keywords: ["order", "track", "status", "delivery", "parcel", "ship"],
    label: "orders or tracking",
    actionValue: "action:recent_orders",
  },
  {
    intent: "cancel_help",
    keywords: ["cancel", "stop", "dont want"],
    label: "cancelling an order",
    actionValue: "action:cancel_help",
  },
  {
    intent: "returns",
    keywords: ["return", "refund", "exchange", "damaged", "wrong"],
    label: "returns or refunds",
    actionValue: "action:return_help",
  },
  {
    intent: "shipping",
    keywords: ["ship", "delivery", "days", "cod", "when"],
    label: "delivery times",
    actionValue: "shipping time",
  },
  {
    intent: "payment",
    keywords: ["pay", "upi", "card", "money", "charged"],
    label: "payment issues",
    actionValue: "payment failed",
  },
  {
    intent: "contact",
    keywords: ["call", "phone", "email", "human", "agent", "talk"],
    label: "contacting support",
    actionValue: "contact support",
  },
];

/** Best-effort guess when intent is unclear — powers “Did you mean?” chips */
export function getIntentSuggestions(input: string, limit = 2): IntentSuggestion[] {
  const q = normalizeForIntent(input);
  if (!q || q.length < 2) return [];

  const scored: { score: number; item: IntentSuggestion }[] = [];

  for (const row of INTENT_HINTS) {
    let score = 0;
    for (const kw of row.keywords) {
      if (q.includes(kw)) score += kw.length >= 5 ? 3 : 2;
      else if (fuzzyHas(q, [kw])) score += 1;
    }
    if (score > 0) {
      scored.push({
        score,
        item: {
          intent: row.intent,
          label: row.label,
          actionValue: row.actionValue,
        },
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

export const INTENT_USER_LABEL: Partial<Record<Intent, string>> = {
  show_orders: "Show my orders",
  cancel_help: "Help me cancel an order",
  returns: "Returns and refunds",
  shipping: "Delivery and shipping",
  payment: "Payment help",
  coupon: "Coupon help",
  sizing: "Size and fit",
  contact: "Contact support",
};

/** Try to match order number in free text against cached orders */
export function findOrderIdByNumber(text: string, orders: Order[]): string | null {
  const t = text.toUpperCase().replace(/\s+/g, " ").trim();
  for (const o of orders) {
    const num = o.orderNumber.toUpperCase();
    if (num && t.includes(num)) return o._id;
  }
  const m = t.match(/\b[A-Z]{2,}[\w#-]*\d{2,}\b/g);
  if (m) {
    for (const token of m) {
      const hit = orders.find(
        (o) => o.orderNumber.toUpperCase() === token.replace(/#/g, ""),
      );
      if (hit) return hit._id;
    }
  }
  const parts = t.split(/\s+/).filter((p) => p.length >= 4);
  for (const part of parts) {
    const hit = orders.find((o) => o.orderNumber.toUpperCase().includes(part));
    if (hit) return hit._id;
  }
  return null;
}

import type { QuickAction } from "./types";

export const STORAGE_KEY = "rani-care-chat-v3";
export const OPEN_KEY = "rani-care-open-v1";
export const MAX_MESSAGES = 48;
export const RECENT_ORDER_LIMIT = 5;

export const INITIAL_ACTIONS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "Cancel an order", value: "action:cancel_help" },
  { label: "Returns & refunds", value: "return refund" },
  { label: "Delivery & shipping", value: "shipping time" },
  { label: "Contact support", value: "contact support" },
];

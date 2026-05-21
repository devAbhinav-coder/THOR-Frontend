import type { QuickAction } from "./types";

export const STORAGE_KEY = "rani-care-chat-v4";
export const META_KEY = "rani-care-meta-v1";
export const OPEN_KEY = "rani-care-open-v2";
export const MAX_MESSAGES = 40;
/** Client-side retention (common for support widgets: 7–14 days) */
export const CHAT_RETENTION_DAYS = 7;
export const CHAT_RETENTION_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
export const RECENT_ORDER_LIMIT = 5;

/** Main menu chips shown after greeting or “something else” */
export const INITIAL_ACTIONS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "Track order", value: "where is my order" },
  { label: "Cancel order", value: "action:cancel_help" },
  { label: "Returns", value: "action:return_help" },
  { label: "Delivery", value: "shipping time" },
  { label: "Contact", value: "contact support" },
];

export const STARTER_PROMPTS: QuickAction[] = [
  { label: "My orders", value: "action:recent_orders" },
  { label: "Track order", value: "where is my order" },
  { label: "Cancel order", value: "action:cancel_help" },
  { label: "Return", value: "action:return_help" },
];

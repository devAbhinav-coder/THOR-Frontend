export type ChatSender = "bot" | "user";

export type QuickAction = {
  label: string;
  value: string;
};

/** Product recommendation card returned by the RAG assistant */
export type ProductCard = {
  name: string;
  slug: string;
  priceInr: number;
  comparePriceInr?: number;
  image?: string;
  category?: string;
  fabric?: string;
  inStock: boolean;
  rating?: number;
};

/** Minimal order snapshot for chat UI + localStorage */
export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total: number;
  createdAt: string;
  preview: string;
  canCancel: boolean;
  trackingNumber?: string;
  shippingCarrier?: string;
};

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: number;
  actions?: QuickAction[];
  orders?: OrderSummary[];
  products?: ProductCard[];
};

export type Intent =
  | "show_orders"
  | "cancel_help"
  | "returns"
  | "shipping"
  | "payment"
  | "coupon"
  | "sizing"
  | "privacy"
  | "terms"
  | "contact"
  | "general";

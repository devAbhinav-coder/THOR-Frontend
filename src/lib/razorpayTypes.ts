/**
 * Razorpay Checkout handoff — enough to type verify + open SDK without `window as any`.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps
 */
export type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayFailedPayload = {
  error?: {
    description?: string;
    reason?: string;
    code?: string;
  };
};

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessPayload) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
};

export type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailedPayload) => void,
  ) => void;
};

export type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayInstance;

export function getRazorpayConstructor(): RazorpayConstructor | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  return Ctor ?? null;
}

/** Brand-aligned Razorpay checkout chrome */
export const RAZORPAY_THEME_COLOR = "#14192f";

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const generateStarArray = (rating: number): (0 | 0.5 | 1)[] => {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return 1;
    if (i < rating) return 0.5;
    return 0;
  }) as (0 | 0.5 | 1)[];
};

/** CSP nonce from root layout (`data-csp-nonce` on `<html>`), for trusted third-party script tags. */
export function getCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.documentElement.getAttribute('data-csp-nonce') || undefined;
}

function razorpayConstructorReady(): boolean {
  return !!(typeof window !== 'undefined' &&
    (window as unknown as { Razorpay?: unknown }).Razorpay);
}

/** Loads Razorpay Checkout script; resolves when `window.Razorpay` is usable. */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (razorpayConstructorReady()) return resolve(true);

    const waitUntilReadyOrTimeout = (maxMs: number) => {
      const deadline = Date.now() + maxMs;
      const id = window.setInterval(() => {
        if (razorpayConstructorReady()) {
          window.clearInterval(id);
          resolve(true);
        } else if (Date.now() > deadline) {
          window.clearInterval(id);
          resolve(false);
        }
      }, 50);
    };

    const existing = document.getElementById('razorpay-script');
    if (existing) {
      waitUntilReadyOrTimeout(20_000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    const n = getCspNonce();
    if (n) script.setAttribute('nonce', n);
    script.onload = () => {
      if (razorpayConstructorReady()) resolve(true);
      else waitUntilReadyOrTimeout(20_000);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

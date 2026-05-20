/** Client-side helpers for OTP auth (cooldowns, idempotency, API errors). */

export type ApiClientError = {
  message: string;
  status?: number;
  retryAfter?: number;
};

const DEFAULT_OTP_COOLDOWN_SEC = 60;
const FORGOT_VERIFY_IDEMP_PREFIX = "hor_forgot_verify_idem:";

export function parseApiClientError(err: unknown): ApiClientError {
  if (err && typeof err === "object") {
    const o = err as { message?: string; status?: number; retryAfter?: number };
    return {
      message: o.message || "Something went wrong",
      status: o.status,
      retryAfter:
        typeof o.retryAfter === "number" && o.retryAfter > 0 ?
          Math.ceil(o.retryAfter)
        : undefined,
    };
  }
  if (err instanceof Error && err.message) {
    return { message: err.message };
  }
  return { message: "Something went wrong" };
}

export function formatOtpRetryMessage(message: string, retryAfter?: number): string {
  if (retryAfter != null && retryAfter > 0) {
    return `${message} Try again in ${retryAfter}s.`;
  }
  return message;
}

/** Reads `retryAfter` from a successful send/resend OTP envelope. */
export function otpRetryAfterFromSuccess(body: unknown): number {
  if (!body || typeof body !== "object") return DEFAULT_OTP_COOLDOWN_SEC;
  const root = body as { data?: { retryAfter?: number }; retryAfter?: number };
  const sec = root.data?.retryAfter ?? root.retryAfter;
  if (typeof sec === "number" && sec > 0) return Math.ceil(sec);
  return DEFAULT_OTP_COOLDOWN_SEC;
}

/**
 * Stable idempotency key per forgot-password email (session).
 * Cleared after successful verify so a new reset flow gets a fresh key.
 */
export function getForgotPasswordVerifyIdempotencyKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (typeof window === "undefined") {
    return `ssr-${normalized}-${Date.now()}`;
  }
  const storageKey = `${FORGOT_VERIFY_IDEMP_PREFIX}${normalized}`;
  let existing = sessionStorage.getItem(storageKey);
  if (!existing) {
    existing =
      typeof crypto !== "undefined" && crypto.randomUUID ?
        crypto.randomUUID()
      : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(storageKey, existing);
  }
  return existing;
}

export function clearForgotPasswordVerifyIdempotencyKey(email: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${FORGOT_VERIFY_IDEMP_PREFIX}${email.trim().toLowerCase()}`);
}

export { DEFAULT_OTP_COOLDOWN_SEC };

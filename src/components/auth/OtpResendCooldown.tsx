"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import {
  DEFAULT_OTP_COOLDOWN_SEC,
  formatOtpRetryMessage,
  otpRetryAfterFromSuccess,
  parseApiClientError,
} from "@/lib/authOtpClient";

export type OtpFlowType = "signup" | "login" | "forgot_password";

type Props = {
  email: string;
  type: OtpFlowType;
  /** Bump to reset the cooldown timer after the parent sends the first code. */
  resetKey?: number;
  /** Server hint (seconds) when parent just sent a code — overrides default 60s. */
  initialSeconds?: number;
  className?: string;
};

/**
 * Resend OTP control with server-aligned cooldown and visible countdown.
 */
export function OtpResendCooldown({
  email,
  type,
  resetKey = 0,
  initialSeconds = DEFAULT_OTP_COOLDOWN_SEC,
  className,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSecondsLeft(
      initialSeconds > 0 ? Math.ceil(initialSeconds) : DEFAULT_OTP_COOLDOWN_SEC,
    );
  }, [email, type, resetKey, initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const onResend = useCallback(async () => {
    if (!email || secondsLeft > 0 || loading) return;
    setLoading(true);
    try {
      const res = await authApi.resendOtp({ email, type });
      const sec = otpRetryAfterFromSuccess(res);
      setSecondsLeft(sec);
      toast.success("A new code was sent to your email.");
    } catch (err: unknown) {
      const { message, retryAfter } = parseApiClientError(err);
      if (retryAfter) setSecondsLeft(retryAfter);
      toast.error(formatOtpRetryMessage(message, retryAfter));
    } finally {
      setLoading(false);
    }
  }, [email, type, secondsLeft, loading]);

  const disabled = secondsLeft > 0 || loading || !email;

  return (
    <div className={className ?? "flex flex-col items-center gap-1"}>
      <button
        type="button"
        onClick={() => void onResend()}
        disabled={disabled}
        className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending…" : secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export type OtpFlowType = "signup" | "login" | "forgot_password";

const COOLDOWN_SEC = 60;

type Props = {
  email: string;
  type: OtpFlowType;
  /** Bump to reset the 60s timer after the parent sends the first code. */
  resetKey?: number;
  className?: string;
};

/**
 * Resend OTP control with a 60s cooldown and visible countdown (matches backend rules).
 */
export function OtpResendCooldown({ email, type, resetKey = 0, className }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SEC);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSecondsLeft(COOLDOWN_SEC);
  }, [email, type, resetKey]);

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
      await authApi.resendOtp({ email, type });
      setSecondsLeft(COOLDOWN_SEC);
      toast.success("A new code was sent to your email.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Could not resend code.");
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
        className="text-sm font-medium text-brand-400 hover:text-brand-300 disabled:text-white/25 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending…" : secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
      </button>
    </div>
  );
}

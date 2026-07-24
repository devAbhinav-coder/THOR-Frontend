"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { TurnstileFieldHandle } from "@/components/auth/TurnstileField";
import { isTurnstileConfigured } from "@/lib/turnstile";

/**
 * Holds the current Turnstile token and resets the widget after each use
 * (Cloudflare tokens are single-use).
 */
export function useTurnstileToken() {
  const ref = useRef<TurnstileFieldHandle>(null);
  const [token, setToken] = useState<string | undefined>();

  const reset = useCallback(() => {
    setToken(undefined);
    ref.current?.reset();
  }, []);

  /** Returns token and clears widget. Toasts + returns null if missing. */
  const consumeOrToast = useCallback((): string | null => {
    if (!isTurnstileConfigured()) return null;
    if (!token?.trim()) {
      toast.error("Please complete the security check.");
      return null;
    }
    const value = token.trim();
    setToken(undefined);
    // Defer reset so the request can leave with the consumed token first.
    queueMicrotask(() => ref.current?.reset());
    return value;
  }, [token]);

  return { ref, token, setToken, reset, consumeOrToast };
}

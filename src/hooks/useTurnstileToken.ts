"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { TurnstileFieldHandle } from "@/components/auth/TurnstileField";
import { isTurnstileConfigured } from "@/lib/turnstile";

/**
 * Holds the current Turnstile token and resets the widget after each use
 * (Cloudflare tokens are single-use).
 *
 * Challenge runs on demand via `ensureToken` / `consumeOrToast` so opening
 * login/signup does not freeze the main thread on mobile WebKit.
 */
export function useTurnstileToken() {
  const ref = useRef<TurnstileFieldHandle>(null);
  const [token, setToken] = useState<string | undefined>();

  const reset = useCallback(() => {
    setToken(undefined);
    ref.current?.reset();
  }, []);

  /**
   * Ensure a fresh token (runs deferred Turnstile execute if needed),
   * then consume it. Toasts + returns null on failure.
   */
  const consumeOrToast = useCallback(async (): Promise<string | null> => {
    if (!isTurnstileConfigured()) return null;

    let value = token?.trim();
    if (!value) {
      try {
        value = (await ref.current?.ensureToken())?.trim();
      } catch (err) {
        const msg =
          err instanceof Error && err.message ?
            err.message
          : "Please complete the security check.";
        toast.error(msg);
        return null;
      }
    }

    if (!value) {
      toast.error("Please complete the security check.");
      return null;
    }

    setToken(undefined);
    // Defer reset so the request can leave with the consumed token first.
    queueMicrotask(() => ref.current?.reset());
    return value;
  }, [token]);

  return { ref, token, setToken, reset, consumeOrToast };
}

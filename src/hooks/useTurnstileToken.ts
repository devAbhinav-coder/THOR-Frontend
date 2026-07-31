"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  isTurnstileAbortError,
  type TurnstileFieldHandle,
} from "@/components/auth/TurnstileField";
import { isTurnstileConfigured } from "@/lib/turnstile";

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

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
  const inflightRef = useRef<Promise<string | null> | null>(null);

  const reset = useCallback(() => {
    setToken(undefined);
    ref.current?.reset();
  }, []);

  const resolveFreshToken = useCallback(async (): Promise<string | null> => {
    let value = token?.trim();
    if (value) return value;

    const runOnce = async () => {
      const handle = ref.current;
      if (!handle) {
        throw new Error("Security check is still loading. Please try again.");
      }
      return (await handle.ensureToken())?.trim() || null;
    };

    try {
      value = (await runOnce()) ?? undefined;
    } catch (err) {
      // Strict Mode / step remount: wait for the new widget, then retry once.
      if (isTurnstileAbortError(err)) {
        await sleep(120);
        try {
          value = (await runOnce()) ?? undefined;
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw err;
      }
    }

    return value?.trim() || null;
  }, [token]);

  /**
   * Ensure a fresh token (runs deferred Turnstile execute if needed),
   * then consume it. Toasts + returns null on failure.
   * Concurrent callers share one in-flight consume (no race toasts).
   */
  const consumeOrToast = useCallback(async (): Promise<string | null> => {
    if (!isTurnstileConfigured()) return null;

    if (inflightRef.current) return inflightRef.current;

    const run = (async (): Promise<string | null> => {
      try {
        const value = await resolveFreshToken();
        if (!value) {
          toast.error("Please complete the security check.");
          return null;
        }

        setToken(undefined);
        // Defer reset so the request can leave with the consumed token first.
        queueMicrotask(() => ref.current?.reset());
        return value;
      } catch (err) {
        const msg =
          err instanceof Error && err.message && !isTurnstileAbortError(err) ?
            err.message
          : "Security check failed. Please try again.";
        toast.error(msg);
        return null;
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = run;
    return run;
  }, [resolveFreshToken]);

  return { ref, token, setToken, reset, consumeOrToast };
}

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  TURNSTILE_ACTION,
  resolveTurnstileSiteKey,
} from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string) => void;
          theme?: "light" | "dark" | "auto";
          action?: string;
          size?: "normal" | "compact" | "flexible";
          execution?: "render" | "execute";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (widgetId: string) => void;
    };
  }
}

export type TurnstileFieldHandle = {
  reset: () => void;
  ensureToken: () => Promise<string>;
};

type Props = {
  onToken: (token: string | undefined) => void;
  className?: string;
};

type Pending = {
  promise: Promise<string>;
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: number;
};

export class TurnstileAbortError extends Error {
  readonly code = "TURNSTILE_ABORT" as const;
  constructor(message = "Security check interrupted") {
    super(message);
    this.name = "TurnstileAbortError";
  }
}

export function isTurnstileAbortError(err: unknown): boolean {
  return (
    err instanceof TurnstileAbortError ||
    (err instanceof Error &&
      (err.name === "TurnstileAbortError" ||
        /unmounted|interrupted|reset|still loading/i.test(err.message)))
  );
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"));
  }
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          scriptPromise = null;
          reject(new Error("Security check failed to load"));
        },
        { once: true },
      );
      return;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Security check failed to load"));
    };
    document.head.appendChild(s);
  });

  return scriptPromise;
}

function scrubOrphanTurnstileOverlays(keepHost: HTMLElement | null) {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="challenges.cloudflare.com"]',
    )
    .forEach((iframe) => {
      if (keepHost && keepHost.contains(iframe)) return;
      const parent = iframe.parentElement;
      if (!parent) return;
      const style = window.getComputedStyle(parent);
      const isFixedOverlay =
        style.position === "fixed" &&
        (parent.getAttribute("data-callback") != null ||
          /challenge|turnstile/i.test(parent.className) ||
          (style.inset === "0px" &&
            Number.parseFloat(style.zIndex || "0") >= 1000));
      if (!isFixedOverlay) return;
      try {
        parent.remove();
      } catch {
        /* ignore */
      }
    });
}

/**
 * Cloudflare Turnstile — deferred execute so auth modal open stays smooth on mobile.
 */
export const TurnstileField = forwardRef<TurnstileFieldHandle, Props>(
  function TurnstileField({ onToken, className }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const renderLockRef = useRef<Promise<string> | null>(null);
    const tokenRef = useRef<string | undefined>(undefined);
    const pendingRef = useRef<Pending | null>(null);
    const mountedRef = useRef(true);
    const everExecutedRef = useRef(false);
    const retryCountRef = useRef(0);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    const clearPendingTimer = useCallback(() => {
      const pending = pendingRef.current;
      if (!pending) return;
      window.clearTimeout(pending.timer);
    }, []);

    const settleToken = useCallback((token: string | undefined) => {
      tokenRef.current = token;
      onTokenRef.current(token);
      const pending = pendingRef.current;
      if (!pending) return;
      pendingRef.current = null;
      window.clearTimeout(pending.timer);
      if (token?.trim()) {
        retryCountRef.current = 0;
        pending.resolve(token.trim());
      } else {
        pending.reject(
          new Error("Security check failed. Please try again."),
        );
      }
    }, []);

    const renderWidget = useCallback(async () => {
      if (widgetIdRef.current) return widgetIdRef.current;
      if (renderLockRef.current) return renderLockRef.current;

      const sitekey = resolveTurnstileSiteKey();

      const lock = (async () => {
        await loadTurnstileScript();
        if (!mountedRef.current || !hostRef.current || !window.turnstile) {
          throw new TurnstileAbortError();
        }
        if (widgetIdRef.current) return widgetIdRef.current;

        // Clear host before render (Strict Mode can leave leftover nodes).
        hostRef.current.replaceChildren();

        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey,
          theme: "auto",
          action: TURNSTILE_ACTION,
          // Explicit size required with execution:"execute" (CF 2026 check).
          size: "normal",
          execution: "execute",
          appearance: "interaction-only",
          callback: (t) => settleToken(t),
          "expired-callback": () => {
            tokenRef.current = undefined;
            onTokenRef.current(undefined);
          },
          "error-callback": () => {
            if (
              mountedRef.current &&
              widgetIdRef.current &&
              window.turnstile &&
              pendingRef.current &&
              retryCountRef.current < 1
            ) {
              retryCountRef.current += 1;
              try {
                // Only reset after a prior execute — reset-before-first-run
                // surfaces Cloudflare's "Turnstile challenge failed" UI.
                if (everExecutedRef.current) {
                  window.turnstile.reset(widgetIdRef.current);
                }
                everExecutedRef.current = true;
                window.turnstile.execute(widgetIdRef.current);
                return;
              } catch {
                /* fall through */
              }
            }
            settleToken(undefined);
          },
        });
        return widgetIdRef.current;
      })();

      renderLockRef.current = lock;
      try {
        return await lock;
      } finally {
        if (renderLockRef.current === lock) renderLockRef.current = null;
      }
    }, [settleToken]);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          tokenRef.current = undefined;
          onTokenRef.current(undefined);
          retryCountRef.current = 0;
          if (pendingRef.current) {
            clearPendingTimer();
            pendingRef.current.reject(
              new TurnstileAbortError("Security check reset"),
            );
            pendingRef.current = null;
          }
          // Soft-reset only after the widget has run once.
          if (
            everExecutedRef.current &&
            widgetIdRef.current &&
            window.turnstile
          ) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch {
              /* ignore */
            }
          }
        },
        ensureToken: () => {
          const existing = tokenRef.current?.trim();
          if (existing) return Promise.resolve(existing);

          if (pendingRef.current) return pendingRef.current.promise;

          if (!mountedRef.current) {
            return Promise.reject(new TurnstileAbortError());
          }

          let resolve!: (token: string) => void;
          let reject!: (err: Error) => void;
          const promise = new Promise<string>((res, rej) => {
            resolve = res;
            reject = rej;
          });

          const timer = window.setTimeout(() => {
            if (pendingRef.current?.promise === promise) {
              pendingRef.current = null;
            }
            reject(
              new Error("Security check timed out. Please try again."),
            );
          }, 45_000);

          pendingRef.current = { promise, resolve, reject, timer };

          void (async () => {
            try {
              const widgetId = await renderWidget();
              if (!mountedRef.current || !window.turnstile) {
                throw new TurnstileAbortError();
              }
              // Fresh token: reset only when re-running after a prior execute.
              // Calling reset() before the first execute causes CF "challenge failed".
              if (everExecutedRef.current) {
                try {
                  window.turnstile.reset(widgetId);
                } catch {
                  /* ignore */
                }
              }
              everExecutedRef.current = true;
              window.turnstile.execute(widgetId);
            } catch (err) {
              if (pendingRef.current?.promise === promise) {
                clearPendingTimer();
                pendingRef.current = null;
              }
              reject(
                err instanceof Error ?
                  err
                : new Error("Security check failed. Please try again."),
              );
            }
          })();

          return promise;
        },
      }),
      [clearPendingTimer, renderWidget],
    );

    useEffect(() => {
      mountedRef.current = true;
      let cancelled = false;

      void (async () => {
        try {
          await renderWidget();
        } catch {
          if (!cancelled) {
            /* ensureToken will retry */
          }
        }
      })();

      return () => {
        cancelled = true;
        mountedRef.current = false;
        everExecutedRef.current = false;
        if (pendingRef.current) {
          clearPendingTimer();
          pendingRef.current.reject(new TurnstileAbortError());
          pendingRef.current = null;
        }
        const host = hostRef.current;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
        }
        window.setTimeout(() => scrubOrphanTurnstileOverlays(host), 0);
      };
    }, [clearPendingTimer, renderWidget]);

    return (
      <div
        ref={hostRef}
        className={className ?? "flex justify-center min-h-[0px] py-0.5"}
        aria-label="Security verification"
      />
    );
  },
);

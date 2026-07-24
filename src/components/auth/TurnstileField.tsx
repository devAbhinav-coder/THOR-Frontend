"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TURNSTILE_ACTION, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          action?: string;
          size?: "normal" | "compact" | "flexible";
          /** Defer PoW until execute() — avoids mobile main-thread freeze on modal open. */
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
  /** Clear token + re-challenge (tokens are single-use). */
  reset: () => void;
  /**
   * Run the deferred challenge and resolve with a fresh token.
   * Safe to call when a token is already ready (returns it).
   */
  ensureToken: () => Promise<string>;
};

type Props = {
  onToken: (token: string | undefined) => void;
  className?: string;
};

type Pending = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: number;
};

/** Drop orphaned Cloudflare challenge iframes that can block scroll after modal close. */
function scrubOrphanTurnstileOverlays(keepHost: HTMLElement | null) {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="challenges.cloudflare.com"]',
    )
    .forEach((iframe) => {
      if (keepHost && keepHost.contains(iframe)) return;
      // Full-viewport challenge shells left after widget.remove()
      const parent = iframe.parentElement;
      if (!parent) return;
      const style = window.getComputedStyle(parent);
      const isOverlay =
        style.position === "fixed" ||
        parent.getAttribute("data-callback") != null ||
        /challenge|turnstile/i.test(parent.className);
      if (isOverlay || !keepHost) {
        try {
          parent.remove();
        } catch {
          /* ignore */
        }
      }
    });
}

/**
 * Cloudflare Turnstile — House of Rani widget.
 * Uses deferred execution so opening login/signup does not freeze mobile scroll.
 * Pass returned token as `turnstileToken` on auth API calls.
 */
export const TurnstileField = forwardRef<TurnstileFieldHandle, Props>(
  function TurnstileField({ onToken, className }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | undefined>(undefined);
    const pendingRef = useRef<Pending | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    const settleToken = useCallback((token: string | undefined) => {
      tokenRef.current = token;
      onTokenRef.current(token);
      const pending = pendingRef.current;
      if (!pending) return;
      pendingRef.current = null;
      window.clearTimeout(pending.timer);
      if (token?.trim()) pending.resolve(token.trim());
      else pending.reject(new Error("Turnstile challenge failed"));
    }, []);

    const loadScript = useCallback(() => {
      if (document.getElementById("cf-turnstile-script")) return;
      const s = document.createElement("script");
      s.id = "cf-turnstile-script";
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      document.head.appendChild(s);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          tokenRef.current = undefined;
          onTokenRef.current(undefined);
          if (pendingRef.current) {
            window.clearTimeout(pendingRef.current.timer);
            pendingRef.current.reject(new Error("Turnstile reset"));
            pendingRef.current = null;
          }
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
        ensureToken: () => {
          const existing = tokenRef.current?.trim();
          if (existing) return Promise.resolve(existing);

          if (!widgetIdRef.current || !window.turnstile) {
            return Promise.reject(new Error("Security check is still loading"));
          }

          return new Promise<string>((resolve, reject) => {
            if (pendingRef.current) {
              window.clearTimeout(pendingRef.current.timer);
              pendingRef.current.reject(new Error("Turnstile superseded"));
            }
            const timer = window.setTimeout(() => {
              pendingRef.current = null;
              reject(new Error("Security check timed out. Please try again."));
            }, 45_000);
            pendingRef.current = { resolve, reject, timer };
            try {
              window.turnstile!.execute(widgetIdRef.current!);
            } catch (err) {
              pendingRef.current = null;
              window.clearTimeout(timer);
              reject(
                err instanceof Error ? err : new Error("Security check failed"),
              );
            }
          });
        },
      }),
      [],
    );

    useEffect(() => {
      loadScript();
      let cancelled = false;
      const id = window.setInterval(() => {
        if (cancelled || !hostRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          action: TURNSTILE_ACTION,
          size: "flexible",
          // Defer PoW until submit — prevents mobile freeze when auth modal opens.
          execution: "execute",
          appearance: "interaction-only",
          callback: (t) => settleToken(t),
          "expired-callback": () => settleToken(undefined),
          "error-callback": () => settleToken(undefined),
        });
        hostRef.current.classList.add("cf-turnstile");
        hostRef.current.setAttribute("data-sitekey", TURNSTILE_SITE_KEY);
        hostRef.current.setAttribute("data-action", TURNSTILE_ACTION);
        window.clearInterval(id);
      }, 200);

      return () => {
        cancelled = true;
        window.clearInterval(id);
        if (pendingRef.current) {
          window.clearTimeout(pendingRef.current.timer);
          pendingRef.current.reject(new Error("Turnstile unmounted"));
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
        scrubOrphanTurnstileOverlays(host);
      };
    }, [loadScript, settleToken]);

    return (
      <div
        ref={hostRef}
        className={className ?? "flex justify-center min-h-[0px] py-0.5"}
        aria-label="Security verification"
      />
    );
  },
);

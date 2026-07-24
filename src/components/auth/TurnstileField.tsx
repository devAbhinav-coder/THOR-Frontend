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
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileFieldHandle = {
  /** Clear token + re-challenge (tokens are single-use). */
  reset: () => void;
};

type Props = {
  onToken: (token: string | undefined) => void;
  className?: string;
};

/**
 * Cloudflare Turnstile — always embeds the House of Rani widget.
 * Pass returned token as `turnstileToken` on auth API calls.
 */
export const TurnstileField = forwardRef<TurnstileFieldHandle, Props>(
  function TurnstileField({ onToken, className }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    const loadScript = useCallback(() => {
      if (document.getElementById("cf-turnstile-script")) return;
      const s = document.createElement("script");
      s.id = "cf-turnstile-script";
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      document.head.appendChild(s);
    }, []);

    useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenRef.current(undefined);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      loadScript();
      const id = window.setInterval(() => {
        if (!hostRef.current || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          action: TURNSTILE_ACTION,
          callback: (t) => onTokenRef.current(t),
          "expired-callback": () => onTokenRef.current(undefined),
          "error-callback": () => onTokenRef.current(undefined),
        });
        // Explicit class/attr for Spin contract + crawlers that look for cf-turnstile
        hostRef.current.classList.add("cf-turnstile");
        hostRef.current.setAttribute("data-sitekey", TURNSTILE_SITE_KEY);
        hostRef.current.setAttribute("data-action", TURNSTILE_ACTION);
        window.clearInterval(id);
      }, 200);
      return () => {
        window.clearInterval(id);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [loadScript]);

    return (
      <div
        ref={hostRef}
        className={className ?? "flex justify-center min-h-[65px] py-1"}
        aria-label="Security verification"
      />
    );
  },
);

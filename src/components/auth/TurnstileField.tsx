"use client";

import { useCallback, useEffect, useRef } from "react";

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
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string | undefined) => void;
  className?: string;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

/**
 * Cloudflare Turnstile hook — renders only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Pass returned token as `turnstileToken` on auth API calls.
 */
export function TurnstileField({ onToken, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const loadScript = useCallback(() => {
    if (!SITE_KEY || document.getElementById("cf-turnstile-script")) return;
    const s = document.createElement("script");
    s.id = "cf-turnstile-script";
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;
    loadScript();
    const id = window.setInterval(() => {
      if (!hostRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        callback: (t) => onToken(t),
        "expired-callback": () => onToken(undefined),
        "error-callback": () => onToken(undefined),
      });
      window.clearInterval(id);
    }, 200);
    return () => {
      window.clearInterval(id);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [loadScript, onToken]);

  if (!SITE_KEY) return null;

  return <div ref={hostRef} className={className ?? "flex justify-center min-h-[65px]"} />;
}

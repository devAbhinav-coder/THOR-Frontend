"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  type CookieConsentChoice,
  getStoredConsent,
  setStoredConsent,
  pushGtagConsent,
} from "@/lib/cookieConsent";

/**
 * Deferred read avoids blocking first paint (requestIdleCallback or macrotask).
 */
function scheduleConsentRead(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const safeRun = () => {
    try {
      cb();
    } catch {
      /* storage / DOM */
    }
  };

  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(safeRun, { timeout: 500 });
    return () => cancelIdleCallback(id);
  }
  const t = window.setTimeout(safeRun, 0);
  return () => window.clearTimeout(t);
}

export default function CookieConsentBanner() {
  /** `null` = not yet read from storage (don’t flash banner). */
  const [visible, setVisible] = useState<boolean | null>(null);

  const applyChoice = useCallback((choice: CookieConsentChoice) => {
    setStoredConsent(choice);
    pushGtagConsent(choice);
    setVisible(false);
  }, []);

  // 1) Initial async read + apply if user already decided
  useEffect(() => {
    let cancelled = false;
    const cancelSchedule = scheduleConsentRead(() => {
      if (cancelled) return;
      const stored = getStoredConsent();
      if (stored) {
        pushGtagConsent(stored);
        setVisible(false);
      } else {
        setVisible(true);
      }
    });
    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, []);

  // 2) After full load / delayed GA — re-send consent so tags that mount late still see it
  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) return;

    const sync = () => {
      pushGtagConsent(stored);
    };

    sync();
    window.addEventListener("load", sync);
    const t1 = window.setTimeout(sync, 800);
    const t2 = window.setTimeout(sync, 2500);

    return () => {
      window.removeEventListener("load", sync);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (visible !== true) return null;

  return (
    <div
      className='fixed inset-x-0 bottom-[4.5rem] z-[700] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-0'
      role='region'
      aria-label='Cookie preferences'
      aria-live='polite'
    >
      <div className='mx-auto max-w-5xl rounded-2xl border border-navy-700 bg-navy-950/95 text-white shadow-2xl backdrop-blur-md'>
        <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5'>
          <div className='min-w-0'>
            <p id='cookie-consent-title' className='text-sm font-semibold'>
              Cookie preferences
            </p>
            <p className='mt-1 text-xs text-white/70 sm:text-sm'>
              We use essential cookies for secure login, cart, and checkout.
              Optional analytics and marketing cookies help us improve your
              experience — only if you accept.
            </p>
            <p className='mt-1 text-[11px] text-white/55'>
              Read our{" "}
              <Link
                href='/privacy'
                className='underline underline-offset-2 hover:text-white/90'
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href='/terms'
                className='underline underline-offset-2 hover:text-white/90'
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
          <div className='flex shrink-0 flex-wrap items-center gap-2 sm:justify-end'>
            <button
              type='button'
              onClick={() => applyChoice("essential_only")}
              className='rounded-lg border border-white/25 px-3 py-2.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
            >
              Essential only
            </button>
            <button
              type='button'
              onClick={() => applyChoice("accepted_all")}
              className='rounded-lg bg-brand-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950'
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

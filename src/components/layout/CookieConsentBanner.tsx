"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "hor_cookie_consent_v1";

type ConsentValue = "accepted_all" | "essential_only";

function updateGoogleConsent(consent: ConsentValue) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
  };
  if (!w.gtag) return;

  w.gtag("consent", "update", {
    analytics_storage: consent === "accepted_all" ? "granted" : "denied",
    ad_storage: consent === "accepted_all" ? "granted" : "denied",
    ad_user_data: consent === "accepted_all" ? "granted" : "denied",
    ad_personalization: consent === "accepted_all" ? "granted" : "denied",
  });
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      if (!existing) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value: ConsentValue) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignore storage failures
    }
    updateGoogleConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className='fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:px-5 sm:pb-5'>
      <div className='mx-auto max-w-5xl rounded-2xl border border-navy-700 bg-navy-950/95 text-white shadow-2xl backdrop-blur'>
        <div className='p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-semibold'>Cookie Preferences</p>
            <p className='mt-1 text-xs sm:text-sm text-white/70'>
              We use essential cookies for secure login and checkout. You can also
              allow analytics cookies to help us improve your shopping experience.
            </p>
          </div>
          <div className='flex items-center gap-2 sm:justify-end'>
            <button
              type='button'
              onClick={() => saveConsent("essential_only")}
              className='rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10'
            >
              Essential Only
            </button>
            <button
              type='button'
              onClick={() => saveConsent("accepted_all")}
              className='rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700'
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

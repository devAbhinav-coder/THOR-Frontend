"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getGuestActivityEmail } from "@/lib/guestActivityIdentity";
import {
  COOKIE_CONSENT_EVENT,
  hasAnalyticsConsent,
  type CookieConsentChoice,
} from "@/lib/cookieConsent";
import {
  flushReplayUploadNow,
  pushReplayEvent,
  resetReplayUploadState,
  scheduleReplayUpload,
  setReplayUploadIdentity,
} from "@/lib/sessionReplayUpload";

const PERIODIC_FLUSH_MS = 20_000;

function shouldRecordPath(path: string): boolean {
  if (!path || path.startsWith("/admin")) return false;
  return true;
}

/** One rrweb recorder per tab — not restarted on every route change. */
let recorderStop: (() => void) | null = null;
let recorderStarting = false;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let recorderPath = "/";

function stopGlobalRecorder(): void {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
  flushReplayUploadNow();
  recorderStop?.();
  recorderStop = null;
  recorderStarting = false;
}

async function ensureGlobalRecorder(): Promise<void> {
  if (typeof window === "undefined") return;
  if (recorderStop || recorderStarting) return;

  recorderStarting = true;

  try {
    const { record } = await import("rrweb");
    if (recorderStop) return;

    recorderStop = record({
      emit(event) {
        pushReplayEvent(event, recorderPath);
      },
      maskAllInputs: true,
      blockClass: "rr-block",
      ignoreClass: "rr-ignore",
      sampling: {
        mousemove: 100,
        mouseInteraction: true,
        scroll: 200,
        media: 1200,
        input: "last",
      },
    }) ?? null;

    periodicTimer = setInterval(() => {
      scheduleReplayUpload(false);
    }, PERIODIC_FLUSH_MS);
  } finally {
    recorderStarting = false;
  }
}

/** Hotjar-style DOM session replay — consent-gated, throttled uploads. */
export default function SessionReplayRecorder() {
  const pathname = usePathname() || "/";
  const userId = useAuthStore((s) => s.user?._id);
  const [consentOk, setConsentOk] = useState(false);

  useEffect(() => {
    return () => {
      stopGlobalRecorder();
      resetReplayUploadState();
    };
  }, []);

  useEffect(() => {
    setConsentOk(hasAnalyticsConsent());
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentChoice>).detail;
      setConsentOk(detail === "accepted_all");
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    const guestEmail =
      userId ? undefined : getGuestActivityEmail() ?? undefined;
    setReplayUploadIdentity({ userId, guestEmail });
  }, [userId]);

  useEffect(() => {
    recorderPath = pathname;
    const ok = consentOk && shouldRecordPath(pathname);

    if (!ok) {
      stopGlobalRecorder();
      resetReplayUploadState();
      return;
    }

    void ensureGlobalRecorder();

    const onHide = () => flushReplayUploadNow();
    window.addEventListener("pagehide", onHide);

    return () => {
      window.removeEventListener("pagehide", onHide);
    };
  }, [consentOk, pathname]);

  return null;
}

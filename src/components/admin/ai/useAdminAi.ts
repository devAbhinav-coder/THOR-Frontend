"use client";

import { useCallback, useEffect, useState } from "react";
import { adminAiApi } from "@/lib/adminAiApi";
import type { AdminAiStatus } from "./types";

let statusCache: AdminAiStatus | null = null;
let statusPromise: Promise<AdminAiStatus> | null = null;

export function useAdminAiStatus() {
  const [status, setStatus] = useState<AdminAiStatus | null>(statusCache);
  const [loading, setLoading] = useState(!statusCache);

  useEffect(() => {
    if (statusCache) {
      setStatus(statusCache);
      setLoading(false);
      return;
    }
    if (!statusPromise) {
      statusPromise = adminAiApi
        .getStatus()
        .then((r) => {
          const s = r.data as AdminAiStatus;
          statusCache = s;
          return s;
        })
        .catch(() => {
          const s: AdminAiStatus = { enabled: false };
          statusCache = s;
          return s;
        });
    }
    statusPromise.then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    statusPromise = null;
    statusCache = null; // force refetch so blogEnabled is never stale
    setLoading(true);
    try {
      const r = await adminAiApi.getStatus();
      const s = r.data as AdminAiStatus;
      statusCache = s;
      setStatus(s);
    } catch {
      setStatus({ enabled: false });
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, refresh };
}

export function aiErrorMessage(err: unknown): string {
  const msg = (err as { message?: string })?.message;
  if (msg?.includes("503") || msg?.toLowerCase().includes("not configured")) {
    return "Blog AI off — backend .env mein GEMINI_API_KEY add karo.";
  }
  if (msg?.includes("429") || msg?.toLowerCase().includes("rate limit")) {
    return "AI rate limit — 30-60 sec wait karo, phir Regenerate dabao.";
  }
  if (msg?.includes("502") || msg?.toLowerCase().includes("blog draft fail")) {
    return "Draft empty aaya — thoda wait karke Regenerate try karo.";
  }
  return msg || "AI request failed.";
}

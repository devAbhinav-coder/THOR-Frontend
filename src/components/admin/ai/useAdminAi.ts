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
    statusCache = null;
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
    return "AI is off — add GROQ_API_KEY on the server.";
  }
  if (msg?.includes("429") || msg?.toLowerCase().includes("limit")) {
    return "AI limit reached — try again in an hour.";
  }
  return msg || "AI request failed.";
}

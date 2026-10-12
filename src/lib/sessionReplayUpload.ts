import { env } from "@/lib/env";
import { getShopSessionKey } from "@/lib/shopSession";
import { getGuestActivityEmail } from "@/lib/guestActivityIdentity";

/** Min gap between chunk uploads (normal browsing). */
export const REPLAY_MIN_UPLOAD_GAP_MS = 18_000;
/** Hard cap before we must spill (still respects gap unless force). */
export const REPLAY_MAX_BUFFER_EVENTS = 250;
/** After 429, pause uploads. */
const RATE_LIMIT_BACKOFF_MS = 90_000;

let sequence = 0;
let lastUploadAt = 0;
let rateLimitedUntil = 0;
let uploadInFlight = false;
let pendingFlush = false;
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

const buffer: unknown[] = [];

type Identity = { userId?: string; guestEmail?: string };

let identity: Identity = {};

export function setReplayUploadIdentity(next: Identity): void {
  identity = next;
}

export function pushReplayEvent(event: unknown, path: string): void {
  buffer.push(event);
  pathRef = path;
  if (buffer.length >= REPLAY_MAX_BUFFER_EVENTS) {
    scheduleReplayUpload(true);
  } else {
    scheduleReplayUpload(false);
  }
}

let pathRef = "/";

function clearScheduledTimer(): void {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/** Queue a flush; force bypasses min gap (page hide / buffer cap). */
export function scheduleReplayUpload(force = false): void {
  if (typeof window === "undefined") return;
  if (Date.now() < rateLimitedUntil) return;

  clearScheduledTimer();

  const now = Date.now();
  const gapOk = now - lastUploadAt >= REPLAY_MIN_UPLOAD_GAP_MS;
  if (!force && !gapOk) {
    const delay = REPLAY_MIN_UPLOAD_GAP_MS - (now - lastUploadAt);
    scheduledTimer = setTimeout(() => {
      scheduledTimer = null;
      void runReplayUpload(true);
    }, delay);
    return;
  }

  if (uploadInFlight) {
    pendingFlush = true;
    return;
  }

  void runReplayUpload(force);
}

export function flushReplayUploadNow(): void {
  clearScheduledTimer();
  void runReplayUpload(true);
}

async function runReplayUpload(force: boolean): Promise<void> {
  if (uploadInFlight) {
    pendingFlush = true;
    return;
  }
  if (Date.now() < rateLimitedUntil) return;

  const sessionKey = getShopSessionKey();
  if (!sessionKey) return;

  if (!buffer.length) return;

  const now = Date.now();
  if (!force && now - lastUploadAt < REPLAY_MIN_UPLOAD_GAP_MS) {
    scheduleReplayUpload(false);
    return;
  }

  const batch = buffer.splice(0, buffer.length);
  if (batch.length < 8 && !force) {
    buffer.unshift(...batch);
    scheduleReplayUpload(false);
    return;
  }

  uploadInFlight = true;
  const payload = {
    sessionKey,
    sequence: sequence++,
    path: pathRef || "/",
    events: batch,
    ...(identity.userId ? { userId: identity.userId } : {}),
    ...(identity.guestEmail ? { guestEmail: identity.guestEmail } : {}),
  };

  const url = `${env.NEXT_PUBLIC_API_URL}/storefront/session-replay-chunk`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      keepalive: true,
    });
    if (res.status === 429) {
      rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
      buffer.unshift(...batch);
      return;
    }
    if (!res.ok) {
      buffer.unshift(...batch);
      return;
    }
    lastUploadAt = Date.now();
  } catch {
    buffer.unshift(...batch);
  } finally {
    uploadInFlight = false;
    if (pendingFlush && buffer.length) {
      pendingFlush = false;
      scheduleReplayUpload(true);
    }
  }
}

export function resetReplayUploadState(): void {
  buffer.length = 0;
  clearScheduledTimer();
}

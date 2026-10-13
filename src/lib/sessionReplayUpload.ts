import { env } from "@/lib/env";
import { getShopSessionKey } from "@/lib/shopSession";

/** Min gap between chunk uploads (normal browsing). */
export const REPLAY_MIN_UPLOAD_GAP_MS = 18_000;
/** Hard cap before we must spill (still respects gap unless force). */
export const REPLAY_MAX_BUFFER_EVENTS = 250;
/** Must match backend validation + sessionReplayService limits (events.max). */
const MAX_EVENTS_PER_CHUNK = 400;
/**
 * Uncompressed JSON size of `events` per chunk. Server allows 2.5 MB; a rrweb
 * FullSnapshot of the home page is ~1.2 MB. Bodies are gzipped on the wire.
 */
const MAX_CHUNK_BYTES = 2_400_000;
/**
 * Browsers reject `keepalive` fetches whose body exceeds 64 KiB *without
 * sending them*. Only use keepalive for small bodies (pagehide flush).
 */
const KEEPALIVE_MAX_BYTES = 60_000;
/** After 429, pause uploads. */
const RATE_LIMIT_BACKOFF_MS = 90_000;
/** After a transient failure (network / 5xx), wait before retrying. */
const TRANSIENT_RETRY_BACKOFF_MS = 30_000;
/** Drop a batch after this many consecutive transient failures. */
const MAX_CONSECUTIVE_FAILURES = 4;
/** After server cap rejections, pause uploads for the rest of the session. */
const REPLAY_CAP_BACKOFF_MS = 6 * 60 * 60 * 1000;

const CAP_STORAGE_KEY = "hor_replay_cap_until";
/**
 * Chunk sequence must be unique per (sessionKey, day) on the server, and the
 * session key survives reloads (sessionStorage), so the counter must too —
 * otherwise post-reload chunks collide and are silently dropped.
 */
const SEQ_STORAGE_KEY = "hor_replay_seq";

function readStorageNumber(key: string): number {
  try {
    if (typeof sessionStorage === "undefined") return 0;
    const n = Number(sessionStorage.getItem(key) ?? "0");
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeStorageNumber(key: string, value: number): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, String(value));
    }
  } catch {
    // ignore
  }
}

function readPersistedCap(): number {
  const n = readStorageNumber(CAP_STORAGE_KEY);
  return n > Date.now() ? n : 0;
}

/** Current sequence number (not yet consumed). */
function peekSequence(): number {
  return readStorageNumber(SEQ_STORAGE_KEY);
}

/** Advance the sequence after a chunk is durably accepted (or dropped). */
function commitSequence(used: number): void {
  writeStorageNumber(SEQ_STORAGE_KEY, used + 1);
}

let lastUploadAt = 0;
let rateLimitedUntil = 0;
let retryAfter = 0;
let consecutiveFailures = 0;
let replayCapUntil = readPersistedCap();
let uploadInFlight = false;
let pendingFlush = false;
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

const buffer: unknown[] = [];

type Identity = { userId?: string; guestEmail?: string };

let identity: Identity = {};

export function setReplayUploadIdentity(next: Identity): void {
  identity = next;
}

function isReplayCapped(): boolean {
  return Date.now() < replayCapUntil;
}

function isPaused(): boolean {
  const now = Date.now();
  return now < rateLimitedUntil || now < retryAfter || isReplayCapped();
}

function pauseRemainingMs(): number {
  return Math.max(rateLimitedUntil, retryAfter, replayCapUntil) - Date.now();
}

export function pushReplayEvent(event: unknown, path: string): void {
  if (isReplayCapped()) return;
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

function scheduleTimer(delayMs: number, force: boolean): void {
  clearScheduledTimer();
  scheduledTimer = setTimeout(() => {
    scheduledTimer = null;
    void runReplayUpload(force);
  }, Math.max(250, delayMs));
}

function eventJsonBytes(event: unknown): number {
  try {
    return JSON.stringify(event).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

/** Split buffered events into API-sized chunks (count + byte limits). */
function buildUploadSlices(events: unknown[]): unknown[][] {
  const slices: unknown[][] = [];
  let current: unknown[] = [];
  let currentBytes = 2; // "[]"

  for (const event of events) {
    const eventBytes = eventJsonBytes(event);
    if (eventBytes > MAX_CHUNK_BYTES) {
      // Cannot ever be accepted by the server; drop it.
      continue;
    }

    const wouldBeBytes = currentBytes + eventBytes + (current.length ? 1 : 0);
    if (
      current.length > 0 &&
      (current.length + 1 > MAX_EVENTS_PER_CHUNK || wouldBeBytes > MAX_CHUNK_BYTES)
    ) {
      slices.push(current);
      current = [event];
      currentBytes = 2 + eventBytes;
    } else {
      current.push(event);
      currentBytes = wouldBeBytes;
    }
  }

  if (current.length) slices.push(current);
  return slices;
}

type EncodedBody = { body: BodyInit; encoding: "gzip" | null };

function bodyBytes(body: BodyInit): number {
  if (typeof body === "string") return body.length;
  if (body instanceof Blob) return body.size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (ArrayBuffer.isView(body)) return body.byteLength;
  return Number.MAX_SAFE_INTEGER;
}

/** gzip the JSON when the browser supports it; body-parser inflates server-side. */
async function encodeBody(json: string): Promise<EncodedBody> {
  if (typeof CompressionStream === "undefined") {
    return { body: json, encoding: null };
  }
  try {
    const stream = new Blob([json])
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    const gz = await new Response(stream).blob();
    return { body: gz, encoding: "gzip" };
  } catch {
    return { body: json, encoding: null };
  }
}

type ChunkPostResult =
  | { ok: true }
  /** Permanently rejected; caller must not retry these events. */
  | { ok: false; kind: "drop" }
  /** Payload too large; retry with the returned (smaller) head, rest re-buffered. */
  | { ok: false; kind: "split"; head: unknown[] }
  /** Transient (network / 5xx / 429); retry later with backoff. */
  | { ok: false; kind: "retry" };

async function postReplayChunk(
  events: unknown[],
  opts: { unloading: boolean },
): Promise<ChunkPostResult> {
  const sessionKey = getShopSessionKey();
  if (!sessionKey) return { ok: false, kind: "drop" };

  const sequence = peekSequence();
  const payload = {
    sessionKey,
    sequence,
    path: pathRef || "/",
    events,
    ...(identity.userId ? { userId: identity.userId } : {}),
    ...(identity.guestEmail ? { guestEmail: identity.guestEmail } : {}),
  };

  const json = JSON.stringify(payload);
  const url = `${env.NEXT_PUBLIC_API_URL}/storefront/session-replay-chunk`;

  try {
    const { body, encoding } = await encodeBody(json);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(encoding ? { "Content-Encoding": encoding } : {}),
      },
      body,
      credentials: "include",
      keepalive: opts.unloading && bodyBytes(body) <= KEEPALIVE_MAX_BYTES,
    });

    if (res.status === 429) {
      rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
      return { ok: false, kind: "retry" };
    }

    if (res.status === 413) {
      let reason: string | undefined;
      try {
        const json = (await res.json()) as { data?: { reason?: string } };
        reason = json.data?.reason;
      } catch {
        reason = undefined;
      }

      if (reason === "session_cap" || reason === "retention_cap") {
        replayCapUntil = Date.now() + REPLAY_CAP_BACKOFF_MS;
        writeStorageNumber(CAP_STORAGE_KEY, replayCapUntil);
        buffer.length = 0;
        return { ok: false, kind: "drop" };
      }

      if (events.length <= 1) {
        commitSequence(sequence);
        return { ok: false, kind: "drop" };
      }

      const mid = Math.ceil(events.length / 2);
      buffer.unshift(...events.slice(mid));
      return { ok: false, kind: "split", head: events.slice(0, mid) };
    }

    if (res.status >= 400 && res.status < 500) {
      // Validation / auth style failure: retrying the same payload won't help.
      commitSequence(sequence);
      return { ok: false, kind: "drop" };
    }

    if (!res.ok) {
      return { ok: false, kind: "retry" };
    }

    commitSequence(sequence);
    return { ok: true };
  } catch {
    return { ok: false, kind: "retry" };
  }
}

/** Queue a flush; force bypasses min gap (page hide / buffer cap). */
export function scheduleReplayUpload(force = false): void {
  if (typeof window === "undefined") return;
  if (isReplayCapped()) return;

  if (isPaused()) {
    // Re-check once the pause ends; never spin.
    if (!scheduledTimer) scheduleTimer(pauseRemainingMs(), true);
    return;
  }

  const now = Date.now();
  const gapOk = now - lastUploadAt >= REPLAY_MIN_UPLOAD_GAP_MS;
  if (!force && !gapOk) {
    if (!scheduledTimer) {
      scheduleTimer(REPLAY_MIN_UPLOAD_GAP_MS - (now - lastUploadAt), true);
    }
    return;
  }

  if (uploadInFlight) {
    pendingFlush = true;
    return;
  }

  clearScheduledTimer();
  void runReplayUpload(force);
}

export function flushReplayUploadNow(): void {
  clearScheduledTimer();
  void runReplayUpload(true, { unloading: true });
}

async function runReplayUpload(
  force: boolean,
  opts: { unloading: boolean } = { unloading: false },
): Promise<void> {
  if (uploadInFlight) {
    pendingFlush = true;
    return;
  }
  if (isPaused()) return;
  if (!buffer.length) return;
  if (!getShopSessionKey()) return;

  const now = Date.now();
  if (!force && now - lastUploadAt < REPLAY_MIN_UPLOAD_GAP_MS) {
    scheduleReplayUpload(false);
    return;
  }

  if (buffer.length < 8 && !force) {
    // Not enough events yet; re-check later via timer (never recurse synchronously).
    scheduleTimer(REPLAY_MIN_UPLOAD_GAP_MS, false);
    return;
  }

  const batch = buffer.splice(0, buffer.length);
  const slices = buildUploadSlices(batch);
  if (!slices.length) return;

  uploadInFlight = true;
  let transientFailure = false;

  try {
    let sliceIndex = 0;
    while (sliceIndex < slices.length) {
      const slice = slices[sliceIndex];
      const result = await postReplayChunk(slice, opts);

      if (result.ok) {
        lastUploadAt = Date.now();
        consecutiveFailures = 0;
        sliceIndex += 1;
        continue;
      }

      if (result.kind === "drop") {
        if (isReplayCapped()) return;
        sliceIndex += 1;
        continue;
      }

      if (result.kind === "split") {
        slices[sliceIndex] = result.head;
        continue;
      }

      // Transient: keep the unsent slices, back off, try again later.
      transientFailure = true;
      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        // Give up on this data rather than hoarding it forever.
        consecutiveFailures = 0;
      } else {
        buffer.unshift(...slices.slice(sliceIndex));
      }
      retryAfter = Math.max(
        retryAfter,
        Date.now() + TRANSIENT_RETRY_BACKOFF_MS,
      );
      break;
    }
  } finally {
    uploadInFlight = false;
    const wantsMore = pendingFlush || transientFailure;
    pendingFlush = false;
    if (wantsMore && buffer.length && !isReplayCapped()) {
      // Never re-run synchronously. Only bypass the min gap when the buffer is
      // genuinely at cap; otherwise events wait for the normal cadence.
      const force = buffer.length >= REPLAY_MAX_BUFFER_EVENTS;
      const delay =
        isPaused() ? pauseRemainingMs()
        : force ? 1_000
        : REPLAY_MIN_UPLOAD_GAP_MS;
      scheduleTimer(delay, force);
    }
  }
}

export function resetReplayUploadState(): void {
  buffer.length = 0;
  clearScheduledTimer();
  pendingFlush = false;
  // replayCapUntil / sequence intentionally kept: they are per-session, not per-mount.
}

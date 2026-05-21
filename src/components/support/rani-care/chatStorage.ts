import {
  CHAT_RETENTION_MS,
  MAX_MESSAGES,
  META_KEY,
  OPEN_KEY,
  STORAGE_KEY,
} from "./constants";
import type { ChatMessage } from "./types";

export type ChatMeta = { lastActivity: number };

function isValidMessage(m: unknown): m is ChatMessage {
  if (typeof m !== "object" || m === null) return false;
  const x = m as ChatMessage;
  return (
    typeof x.id === "string" &&
    (x.sender === "bot" || x.sender === "user") &&
    typeof x.text === "string" &&
    typeof x.timestamp === "number"
  );
}

function retentionCutoff(): number {
  return Date.now() - CHAT_RETENTION_MS;
}

export function pruneMessages(messages: ChatMessage[]): ChatMessage[] {
  const cutoff = retentionCutoff();
  return messages
    .filter(isValidMessage)
    .filter((m) => m.timestamp >= cutoff)
    .slice(-MAX_MESSAGES);
}

export function loadStoredMessages(): {
  messages: ChatMessage[];
  expiredCount: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], expiredCount: 0 };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { messages: [], expiredCount: 0 };
    const valid = parsed.filter(isValidMessage);
    const cutoff = retentionCutoff();
    const kept = valid.filter((m) => m.timestamp >= cutoff).slice(-MAX_MESSAGES);
    const expiredCount = valid.length - kept.length;
    if (kept.length !== valid.length || kept.length > MAX_MESSAGES) {
      persistMessages(kept);
    }
    return { messages: kept, expiredCount };
  } catch {
    return { messages: [], expiredCount: 0 };
  }
}

export function persistMessages(messages: ChatMessage[]): void {
  const pruned = pruneMessages(messages);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    const meta: ChatMeta = { lastActivity: Date.now() };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // quota or private mode
  }
}

export function clearChatStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    // ignore
  }
}

export function loadOpenState(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveOpenState(open: boolean): void {
  try {
    localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    // ignore
  }
}

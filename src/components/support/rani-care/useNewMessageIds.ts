"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "./types";

/**
 * Only animates messages added after initial hydration (not restored history).
 */
export function useNewMessageIds(messages: ChatMessage[]) {
  const seenRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      for (const m of messages) seenRef.current.add(m.id);
      readyRef.current = true;
      return;
    }
    for (const m of messages) seenRef.current.add(m.id);
  }, [messages]);

  return (id: string) => {
    if (!readyRef.current) return false;
    return !seenRef.current.has(id);
  };
}

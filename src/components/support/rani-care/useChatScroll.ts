"use client";

import { useCallback, useEffect, useRef } from "react";

const NEAR_BOTTOM_PX = 80;

type ScrollDeps = {
  messageCount: number;
  typing: boolean;
  loadingOrders: boolean;
};

/**
 * Sticky-to-bottom scroll (Intercom / Zendesk style):
 * auto-scroll on open and new activity only if user is already near the bottom.
 */
export function useChatScroll(open: boolean, deps: ScrollDeps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback(
    (opts?: { smooth?: boolean; force?: boolean }) => {
      if (!opts?.force && !stickToBottomRef.current) return;

      const container = scrollRef.current;
      const behavior =
        opts?.smooth === false ? "auto" : (
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ?
            "auto"
          : "smooth"
        );

      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
        return;
      }
      endRef.current?.scrollIntoView({ behavior, block: "end" });
    },
    [],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottomRef.current = isNearBottom();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom, open]);

  useEffect(() => {
    if (!open) return;
    stickToBottomRef.current = true;
    const instant = window.setTimeout(
      () => scrollToBottom({ force: true, smooth: false }),
      0,
    );
    const smooth = window.setTimeout(
      () => scrollToBottom({ force: true, smooth: true }),
      380,
    );
    return () => {
      window.clearTimeout(instant);
      window.clearTimeout(smooth);
    };
  }, [open, scrollToBottom]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom({ smooth: true });
  }, [
    open,
    deps.messageCount,
    deps.typing,
    deps.loadingOrders,
    scrollToBottom,
  ]);

  return { scrollRef, endRef, scrollToBottom };
}

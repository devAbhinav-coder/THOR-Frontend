"use client";

import { useCallback, useEffect, type RefObject } from "react";

const MAX_HEIGHT_PX = 96;

export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [ref]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return resize;
}

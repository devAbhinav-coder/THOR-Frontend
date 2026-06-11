"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLOSE_DELAY_MS = 180;

function useHoverCapablePointer() {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverCapable(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return hoverCapable;
}

export function useNavDropdown() {
  const hoverCapable = useHoverCapablePointer();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDismissedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    cancelCloseTimer();
    setIsOpen(true);
  }, [cancelCloseTimer]);

  const close = useCallback(() => {
    cancelCloseTimer();
    setIsOpen(false);
  }, [cancelCloseTimer]);

  const handleZoneEnter = useCallback(() => {
    if (!hoverCapable) return;
    if (hoverDismissedRef.current) return;
    open();
  }, [hoverCapable, open]);

  const handleZoneLeave = useCallback(() => {
    if (!hoverCapable) return;
    hoverDismissedRef.current = false;
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [hoverCapable, cancelCloseTimer]);

  const handleTriggerClick = useCallback(() => {
    if (hoverCapable) {
      cancelCloseTimer();
      if (isOpen) {
        hoverDismissedRef.current = true;
        close();
        return;
      }
      hoverDismissedRef.current = false;
      open();
      return;
    }
    setIsOpen((open) => !open);
  }, [hoverCapable, isOpen, open, close, cancelCloseTimer]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        hoverDismissedRef.current = true;
        close();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen, close]);

  const zoneProps = {
    onMouseEnter: handleZoneEnter,
    onMouseLeave: handleZoneLeave,
  };

  return {
    containerRef,
    isOpen,
    open,
    close,
    handleTriggerClick,
    zoneProps,
  };
}

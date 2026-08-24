"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FAB_POSITION_KEY } from "./constants";

export const RANI_FAB_SIZE_PX = 48;
const EDGE_PAD_PX = 12;
const DRAG_THRESHOLD_PX = 8;

export type FabPoint = { x: number; y: number };

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function readStoredFabPosition(): FabPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FAB_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FabPoint;
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function persistFabPosition(point: FabPoint): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(point));
  } catch {
    // ignore quota
  }
}

function readRootRemPx(): number {
  if (typeof window === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function readSafeAreaBottomPx(): number {
  if (typeof document === "undefined") return 0;
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none";
  document.body.appendChild(el);
  const inset = parseFloat(getComputedStyle(el).paddingBottom) || 0;
  document.body.removeChild(el);
  return inset;
}

/** Keep FAB above bottom tab bar + safe area, same offsets as Navbar shell. */
export function getFabBounds(hasMobileBottomNav: boolean): Bounds {
  const rem = readRootRemPx();
  const bottomChromePx =
    (hasMobileBottomNav ? rem * (3.25 + 0.625) : rem * 0.75) +
    readSafeAreaBottomPx();

  const w = window.innerWidth;
  const h = window.innerHeight;

  return {
    minX: EDGE_PAD_PX,
    maxX: Math.max(EDGE_PAD_PX, w - RANI_FAB_SIZE_PX - EDGE_PAD_PX),
    minY: EDGE_PAD_PX,
    maxY: Math.max(
      EDGE_PAD_PX,
      h - RANI_FAB_SIZE_PX - bottomChromePx,
    ),
  };
}

export function getDefaultFabPosition(hasMobileBottomNav: boolean): FabPoint {
  const bounds = getFabBounds(hasMobileBottomNav);
  return {
    x: bounds.maxX,
    y: bounds.maxY,
  };
}

function clampFabPoint(point: FabPoint, bounds: Bounds): FabPoint {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, point.y)),
  };
}

function snapFabX(x: number, bounds: Bounds): number {
  const mid = (bounds.minX + bounds.maxX) / 2;
  return x < mid ? bounds.minX : bounds.maxX;
}

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type Options = {
  hasMobileBottomNav: boolean;
  onOpen: () => void;
};

export function useDraggableFabPosition({
  hasMobileBottomNav,
  onOpen,
}: Options) {
  const [position, setPosition] = useState<FabPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const clampAndSet = useCallback(
    (point: FabPoint, snap = false) => {
      const bounds = getFabBounds(hasMobileBottomNav);
      const clamped = clampFabPoint(point, bounds);
      const next = snap ?
        { x: snapFabX(clamped.x, bounds), y: clamped.y }
      : clamped;
      setPosition(next);
      persistFabPosition(next);
      return next;
    },
    [hasMobileBottomNav],
  );

  useEffect(() => {
    const stored = readStoredFabPosition();
    const bounds = getFabBounds(hasMobileBottomNav);
    const initial = clampFabPoint(
      stored ?? getDefaultFabPosition(hasMobileBottomNav),
      bounds,
    );
    setPosition(initial);
  }, [hasMobileBottomNav]);

  useEffect(() => {
    if (!position) return;

    const onResize = () => {
      clampAndSet(position);
    };

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [position, clampAndSet]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !position) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: position.x,
        originY: position.y,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;

      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        setIsDragging(true);
      }

      event.preventDefault();
      clampAndSet({
        x: drag.originX + dx,
        y: drag.originY + dy,
      });
    },
    [clampAndSet],
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      dragRef.current = null;
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (drag.moved && position) {
        clampAndSet(position, true);
        return;
      }

      onOpen();
    },
    [clampAndSet, onOpen, position],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      finishDrag(event);
    },
    [finishDrag],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setIsDragging(false);
      if (position) clampAndSet(position, true);
    },
    [clampAndSet, position],
  );

  return {
    position,
    isDragging,
    fabProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}

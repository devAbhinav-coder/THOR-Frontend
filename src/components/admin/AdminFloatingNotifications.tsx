'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/layout/NotificationBell';

const FLOAT_ANCHOR_KEY = 'rani-admin-floating-notifications-v1';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function clampAnchor(right: number, bottom: number, elW: number, elH: number) {
  const margin = 8;
  return {
    right: clamp(right, margin, Math.max(margin, window.innerWidth - elW - margin)),
    bottom: clamp(bottom, margin, Math.max(margin, window.innerHeight - elH - margin)),
  };
}

export default function AdminFloatingNotifications() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<{ right: number; bottom: number } | null>({
    right: 16,
    bottom: 20,
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(FLOAT_ANCHOR_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { right?: number; bottom?: number };
        if (typeof parsed.right === 'number' && typeof parsed.bottom === 'number') {
          setAnchor({ right: parsed.right, bottom: parsed.bottom });
          return;
        }
      }
    } catch {
      // ignore storage parse errors
    }
    setAnchor({ right: 16, bottom: 20 });
  }, []);

  const clampToViewport = useCallback(() => {
    setAnchor((prev) => {
      if (!prev || !wrapRef.current) return prev;
      const rect = wrapRef.current.getBoundingClientRect();
      const next = clampAnchor(prev.right, prev.bottom, rect.width, rect.height);
      if (next.right === prev.right && next.bottom === prev.bottom) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!anchor) return;
    try {
      localStorage.setItem(FLOAT_ANCHOR_KEY, JSON.stringify(anchor));
    } catch {
      // ignore storage failures
    }
  }, [anchor]);

  useEffect(() => {
    const onResize = () => clampToViewport();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  useLayoutEffect(() => {
    clampToViewport();
  }, [clampToViewport]);

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if ((e.pointerType !== 'touch' && e.button !== 0) || anchor === null) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startRight = anchor.right;
      const startBottom = anchor.bottom;
      let moved = false;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (!wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        setAnchor(clampAnchor(startRight - dx, startBottom - dy, rect.width, rect.height));
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (moved) ev.preventDefault();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [anchor],
  );

  return (
    <div
      ref={wrapRef}
      className={cn(
        'fixed z-[100] pointer-events-auto',
        anchor === null && 'bottom-5 right-4 sm:bottom-6 sm:right-6',
      )}
      style={anchor ? { right: anchor.right, bottom: anchor.bottom } : undefined}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0f14]/95 px-2 py-2 shadow-[0_14px_32px_-16px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        <button
          type="button"
          onPointerDown={startDrag}
          className="group inline-flex h-8 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300 active:cursor-grabbing [touch-action:none] cursor-grab"
          title="Drag to move notifications"
          aria-label="Drag notification widget"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <div className="theme-dark text-white">
          <NotificationBell align="right" />
        </div>
      </div>
    </div>
  );
}

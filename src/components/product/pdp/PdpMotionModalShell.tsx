"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Matches sticky/fixed store header (`h-[4.25rem]`). */
const STORE_NAV_HEIGHT = "4.25rem";

type PdpMotionModalShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

/** Full-viewport media modal — portaled above navbar, safe vertical inset. */
export function PdpMotionModalShell({
  open,
  title,
  onClose,
  footer,
  children,
}: PdpMotionModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy-900/90 px-3 backdrop-blur-md sm:px-5"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed z-[10000] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
        style={{
          top: `calc(${STORE_NAV_HEIGHT} + max(0.5rem, env(safe-area-inset-top, 0px)))`,
          right: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        className="flex w-full max-h-[calc(100dvh-5.75rem)] flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-fit max-w-full shrink-0">{children}</div>

        {footer ?
          <div className="mt-4 shrink-0">{footer}</div>
        : null}
      </div>
    </div>,
    document.body,
  );
}

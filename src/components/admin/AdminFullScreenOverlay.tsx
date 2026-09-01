"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Full-viewport overlay via portal — sits above admin sidebar (z-20) and locks page scroll. */
export default function AdminFullScreenOverlay({
  open,
  children,
  className = "",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;
    const main = document.querySelector(
      "main[data-lenis-prevent]",
    ) as HTMLElement | null;

    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    const prevMain = main?.style.overflow ?? "";

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    if (main) main.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      if (main) main.style.overflow = prevMain;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden overscroll-none ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body,
  );
}

export const overlayScrollClass =
  "overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

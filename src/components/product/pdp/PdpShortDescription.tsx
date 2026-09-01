"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PdpShortDescriptionProps = {
  text: string;
  className?: string;
};

/** Two-line clamp with ellipsis; tap/click expands to full short description. */
export function PdpShortDescription({
  text,
  className,
}: PdpShortDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;

    const measure = () => {
      setCanExpand(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, expanded]);

  const interactive = canExpand || expanded;

  return (
    <p
      ref={ref}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={interactive ? expanded : undefined}
      onClick={() => {
        if (interactive) setExpanded((open) => !open);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((open) => !open);
        }
      }}
      className={cn(
        "max-w-lg text-xs leading-relaxed text-gray-600 sm:text-sm",
        !expanded && "line-clamp-2",
        interactive && "cursor-pointer",
        className,
      )}
    >
      {text}
    </p>
  );
}

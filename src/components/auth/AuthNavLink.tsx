"use client";

import Link from "next/link";

type Props = {
  embedded?: boolean;
  onNavigate?: () => void;
  href: string;
  className?: string;
  children: React.ReactNode;
};

/** In modal mode uses a button; on auth pages uses Next Link. */
export default function AuthNavLink({
  embedded,
  onNavigate,
  href,
  className,
  children,
}: Props) {
  if (embedded && onNavigate) {
    return (
      <button type="button" onClick={onNavigate} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
  onAlreadySignedIn: () => void;
  children: React.ReactNode;
};

/** Closes the auth modal when the user is already signed in. */
export default function AuthModalGuestGuard({ onAlreadySignedIn, children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const hasSessionChecked = useAuthStore((s) => s.hasSessionChecked);

  useEffect(() => {
    if (!hasHydrated || !hasSessionChecked || !isAuthenticated) return;
    onAlreadySignedIn();
  }, [hasHydrated, hasSessionChecked, isAuthenticated, onAlreadySignedIn]);

  if (!hasHydrated || !hasSessionChecked) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="h-40 w-full rounded-xl bg-navy-900/30 animate-pulse" aria-hidden />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">You are already signed in…</p>
    );
  }

  return <>{children}</>;
}

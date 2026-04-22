"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

function safeRedirectPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/auth")) return null;
  return raw;
}

export default function AuthGuestOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const hasSessionChecked = useAuthStore((s) => s.hasSessionChecked);

  const target = useMemo(() => {
    const r = safeRedirectPath(searchParams.get("redirect"));
    return r || "/";
  }, [searchParams]);

  useEffect(() => {
    if (!hasHydrated || !hasSessionChecked || !isAuthenticated) return;
    router.replace(target);
  }, [hasHydrated, hasSessionChecked, isAuthenticated, router, target]);

  if (!hasHydrated || !hasSessionChecked) {
    return (
      <div className='flex-1 flex items-center justify-center px-4 pb-12'>
        <div
          className='w-full max-w-md h-80 rounded-2xl bg-navy-900/40 border border-navy-800 animate-pulse'
          aria-hidden
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className='flex-1 flex items-center justify-center px-4 pb-12'>
        <p className='text-white/50 text-sm'>Redirecting…</p>
      </div>
    );
  }

  return (
    <div className='flex-1 flex items-center justify-center px-4 pb-12'>
      {children}
    </div>
  );
}

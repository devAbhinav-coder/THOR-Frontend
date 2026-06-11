"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import AccountSidebar from "./AccountSidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    isLoading,
    _hasHydrated,
    hasSessionChecked,
  } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!_hasHydrated || !hasSessionChecked) return;
    if (!isLoading && !isAuthenticated) {
      router.replace(loginUrlWithRedirect("/dashboard"));
    }
  }, [isAuthenticated, isLoading, router, _hasHydrated, hasSessionChecked]);

  if (!_hasHydrated || !hasSessionChecked || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-account-surface">
        <div
          className="h-9 w-9 rounded-full border-2 border-account-secondary border-t-transparent animate-spin"
          aria-hidden
        />
        <span className="sr-only">Loading account…</span>
      </div>
    );
  }

  return (
    <div className="bg-account-surface min-h-screen">
      {pathname !== "/dashboard" && (
        <div className="md:hidden bg-account-surface-container-lowest border-b border-account-outline-variant/30 flex items-center px-4 py-3 sticky top-14 z-40">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-account-on-surface-variant hover:text-account-primary transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-account-surface-container flex items-center justify-center border border-account-outline-variant/30">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
            Back to Dashboard
          </button>
        </div>
      )}

      <div className="max-w-account-container mx-auto px-account-margin-mobile md:px-account-margin-desktop py-account-stack-md md:py-account-stack-lg">
        <div className="flex flex-col md:flex-row gap-account-gutter">
          <div className="shrink-0 md:sticky md:top-20 md:self-start">
            <AccountSidebar />
          </div>
          <main className="flex-grow flex flex-col min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

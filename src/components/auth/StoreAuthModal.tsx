"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import AuthGoogleShell from "@/app/auth/AuthGoogleShell";
import { useAuthStore } from "@/store/useAuthStore";
import {
  closeAuthModalUrl,
  parseAuthModalView,
  switchAuthModalViewUrl,
  type AuthModalView,
} from "@/lib/authModal";
import { safeRedirectPath } from "@/lib/safeRedirect";

const LoginPageClient = dynamic(() => import("@/app/auth/login/LoginPageClient"), {
  ssr: false,
});
const SignupPageClient = dynamic(() => import("@/app/auth/signup/SignupPageClient"), {
  ssr: false,
});
const ForgotPasswordClient = dynamic(
  () => import("@/app/auth/forgot-password/ForgotPasswordClient"),
  { ssr: false },
);

const TITLES: Record<AuthModalView, string> = {
  login: "Enter the House",
  signup: "Join the House",
  forgot: "Recover Access",
};

const SUBTITLES: Partial<Record<AuthModalView, string>> = {
  signup: "Discover timeless elegance at The House of Rani. Your journey begins here ",
  forgot: "We will email you a secure 6-digit code",
};

export default function StoreAuthModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSessionChecked = useAuthStore((s) => s.hasSessionChecked);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const sessionReady = hasHydrated && hasSessionChecked;

  const view = parseAuthModalView(searchParams.get("auth"));
  const redirectRaw = searchParams.get("redirect");
  const redirect = useMemo(
    () => safeRedirectPath(redirectRaw?.split("?")[0] || "/") || "/",
    [redirectRaw],
  );

  /** Optimistic close so X unlocks scroll immediately (don't wait on router). */
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false);
  }, [view]);

  const dismissModal = useCallback(() => {
    setDismissed(true);
    router.replace(closeAuthModalUrl(pathname, search), { scroll: false });
  }, [pathname, router, search]);

  const switchView = useCallback(
    (next: AuthModalView) => {
      router.push(switchAuthModalViewUrl(pathname, search, next), { scroll: false });
    },
    [pathname, router, search],
  );

  /** After a fresh login/signup inside the modal — close overlay then go to redirect target. */
  const onAuthSuccess = useCallback(() => {
    const cleanUrl = closeAuthModalUrl(pathname, search);
    const pathOnly = pathname.split("?")[0] || "/";
    const redirectPath = redirect.split("?")[0] || "/";

    router.replace(cleanUrl, { scroll: false });

    if (redirectPath !== pathOnly) {
      router.push(redirect);
    }
    router.refresh();
  }, [pathname, redirect, router, search]);

  useEffect(() => {
    if (!view || !sessionReady || !isAuthenticated) return;
    dismissModal();
  }, [view, sessionReady, isAuthenticated, dismissModal]);

  if (!view || dismissed) return null;

  if (sessionReady && isAuthenticated) return null;

  return (
    <AuthModal
      open
      view={view}
      title={TITLES[view]}
      subtitle={SUBTITLES[view]}
      onClose={dismissModal}
    >
      <AuthGoogleShell>
        {!sessionReady ?
          <div
            className="min-h-[160px] flex items-center justify-center"
            role="status"
            aria-label="Loading sign in"
          >
            <div className="h-9 w-9 animate-spin border-2 border-[#c5a059] border-t-transparent" />
          </div>
        : <>
            {view === "login" && (
              <LoginPageClient
                embedded
                redirect={redirect}
                onSuccess={onAuthSuccess}
                onSwitchToSignup={() => switchView("signup")}
                onForgotPassword={() => switchView("forgot")}
              />
            )}
            {view === "signup" && (
              <SignupPageClient
                embedded
                onSuccess={onAuthSuccess}
                onSwitchToLogin={() => switchView("login")}
              />
            )}
            {view === "forgot" && (
              <ForgotPasswordClient
                embedded
                onSuccess={onAuthSuccess}
                onBackToLogin={() => switchView("login")}
              />
            )}
          </>
        }
      </AuthGoogleShell>
    </AuthModal>
  );
}

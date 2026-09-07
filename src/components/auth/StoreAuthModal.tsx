"use client";

import { useCallback, useEffect, useMemo } from "react";
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
import LoginPageClient from "@/app/auth/login/LoginPageClient";
import SignupPageClient from "@/app/auth/signup/SignupPageClient";
import ForgotPasswordClient from "@/app/auth/forgot-password/ForgotPasswordClient";
import AdminTwoFactorLoginStep from "@/components/auth/AdminTwoFactorLoginStep";

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
  const admin2faPending = useAuthStore((s) => s.admin2faPending);
  const clearAdmin2faPending = useAuthStore((s) => s.clearAdmin2faPending);
  const sessionReady = hasHydrated && hasSessionChecked;

  const view = parseAuthModalView(searchParams.get("auth"));
  const redirectRaw = searchParams.get("redirect");
  const redirect = useMemo(
    () => safeRedirectPath(redirectRaw?.split("?")[0] || "/") || "/",
    [redirectRaw],
  );

  const dismissModal = useCallback(() => {
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
    if (!view || !sessionReady || !isAuthenticated || admin2faPending) return;
    dismissModal();
  }, [view, sessionReady, isAuthenticated, admin2faPending, dismissModal]);

  if (!view && !admin2faPending) return null;

  if (sessionReady && isAuthenticated && !admin2faPending) return null;

  const modalView = admin2faPending ? "login" : view!;
  const modalTitle = admin2faPending ? "Admin two-factor" : TITLES[view!];
  const modalSubtitle = admin2faPending
    ? "Enter the code from your authenticator app"
    : SUBTITLES[view!];

  return (
    <AuthModal
      open
      view={modalView}
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={admin2faPending ? clearAdmin2faPending : dismissModal}
    >
      <AuthGoogleShell>
        <div className="relative min-h-[160px]">
          {admin2faPending ? (
            <AdminTwoFactorLoginStep
              embedded
              pendingToken={admin2faPending.pendingToken}
              email={admin2faPending.email}
              name={admin2faPending.name}
              onSuccess={onAuthSuccess}
              onBack={clearAdmin2faPending}
            />
          ) : view === "login" ? (
            <LoginPageClient
              embedded
              redirect={redirect}
              onSuccess={onAuthSuccess}
              onSwitchToSignup={() => switchView("signup")}
              onForgotPassword={() => switchView("forgot")}
            />
          ) : view === "signup" ? (
            <SignupPageClient
              embedded
              onSuccess={onAuthSuccess}
              onSwitchToLogin={() => switchView("login")}
            />
          ) : view === "forgot" ? (
            <ForgotPasswordClient
              embedded
              onSuccess={onAuthSuccess}
              onBackToLogin={() => switchView("login")}
            />
          ) : null}
        </div>
      </AuthGoogleShell>
    </AuthModal>
  );
}

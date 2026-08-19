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
const AdminTwoFactorLoginStep = dynamic(
  () => import("@/components/auth/AdminTwoFactorLoginStep"),
  { ssr: false },
);

function AuthFormLoadingSpinner() {
  return (
    <div
      className="absolute inset-0 z-10 flex min-h-[160px] items-center justify-center bg-[#faf9f7]/90"
      role="status"
      aria-label="Loading sign in"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
    </div>
  );
}

/** Signals when the dynamically imported auth form has mounted. */
function AuthFormReadyGate({
  onReady,
  children,
}: {
  onReady: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return <>{children}</>;
}

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

  const [formMounted, setFormMounted] = useState(false);
  useEffect(() => {
    setFormMounted(false);
  }, [view]);

  const onFormReady = useCallback(() => {
    setFormMounted(true);
  }, []);

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

  const showFormLoading = !sessionReady || !formMounted;
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
          {showFormLoading && !admin2faPending && <AuthFormLoadingSpinner />}
          {admin2faPending ? (
            <AuthFormReadyGate onReady={onFormReady}>
              <AdminTwoFactorLoginStep
                embedded
                pendingToken={admin2faPending.pendingToken}
                email={admin2faPending.email}
                name={admin2faPending.name}
                onSuccess={onAuthSuccess}
                onBack={clearAdmin2faPending}
              />
            </AuthFormReadyGate>
          ) : view === "login" ? (
            <AuthFormReadyGate onReady={onFormReady}>
              <LoginPageClient
                embedded
                redirect={redirect}
                onSuccess={onAuthSuccess}
                onSwitchToSignup={() => switchView("signup")}
                onForgotPassword={() => switchView("forgot")}
              />
            </AuthFormReadyGate>
          ) : view === "signup" ? (
            <AuthFormReadyGate onReady={onFormReady}>
              <SignupPageClient
                embedded
                onSuccess={onAuthSuccess}
                onSwitchToLogin={() => switchView("login")}
              />
            </AuthFormReadyGate>
          ) : view === "forgot" ? (
            <AuthFormReadyGate onReady={onFormReady}>
              <ForgotPasswordClient
                embedded
                onSuccess={onAuthSuccess}
                onBackToLogin={() => switchView("login")}
              />
            </AuthFormReadyGate>
          ) : null}
        </div>
      </AuthGoogleShell>
    </AuthModal>
  );
}

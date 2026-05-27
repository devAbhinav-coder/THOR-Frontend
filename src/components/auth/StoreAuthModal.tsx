"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import AuthModalGuestGuard from "@/components/auth/AuthModalGuestGuard";
import AuthGoogleShell from "@/app/auth/AuthGoogleShell";
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
  login: "Sign in",
  signup: "Create account",
  forgot: "Reset password",
};

const SUBTITLES: Partial<Record<AuthModalView, string>> = {
  login: "Welcome back — continue shopping sarees you love",
  signup: "A quick 2-step signup, then verify your email",
  forgot: "We will email you a secure 6-digit code",
};

export default function StoreAuthModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();

  const view = parseAuthModalView(searchParams.get("auth"));
  const redirectRaw = searchParams.get("redirect");
  const redirect = useMemo(
    () => safeRedirectPath(redirectRaw?.split("?")[0] || "/") || "/",
    [redirectRaw],
  );

  const close = useCallback(() => {
    router.push(closeAuthModalUrl(pathname, search), { scroll: false });
  }, [pathname, router, search]);

  const switchView = useCallback(
    (next: AuthModalView) => {
      router.push(switchAuthModalViewUrl(pathname, search, next), { scroll: false });
    },
    [pathname, router, search],
  );

  const onAuthSuccess = useCallback(() => {
    close();
    router.push(redirect);
    router.refresh();
  }, [close, redirect, router]);

  if (!view) return null;

  return (
    <AuthModal
      open
      title={TITLES[view]}
      subtitle={SUBTITLES[view]}
      onClose={close}
    >
      <AuthGoogleShell>
        <AuthModalGuestGuard onAlreadySignedIn={onAuthSuccess}>
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
        </AuthModalGuestGuard>
      </AuthGoogleShell>
    </AuthModal>
  );
}

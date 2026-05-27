"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthNavLink from "@/components/auth/AuthNavLink";
import {
  AuthFormRoot,
  AuthFormHeader,
  AuthFormDivider,
  AuthFormFooter,
  AuthBackButton,
} from "@/components/auth/AuthFormChrome";
import { authLinkText, authGhostBtn } from "@/lib/authFormShell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import AuthPendingOverlay from "@/components/auth/AuthPendingOverlay";
import { ApiValidationError } from "@/lib/parseApi";
import {
  DEFAULT_OTP_COOLDOWN_SEC,
  formatOtpRetryMessage,
  otpRetryAfterFromSuccess,
  parseApiClientError,
} from "@/lib/authOtpClient";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const otpEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpCodeSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

type OtpEmailForm = z.infer<typeof otpEmailSchema>;
type OtpCodeForm = z.infer<typeof otpCodeSchema>;
type PendingCopy = { title: string; description: string };

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type LoginPageClientProps = {
  embedded?: boolean;
  redirect?: string;
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
};

export default function LoginPageClient({
  embedded = false,
  redirect: redirectProp,
  onSuccess,
  onSwitchToSignup,
  onForgotPassword,
}: LoginPageClientProps = {}) {
  const [showPassword, setShowPassword] = useState(false);
  /** GSI re-inits on every `width` change — render only after mount so width is stable (fixes first-click failures). */
  const [googleUiReady, setGoogleUiReady] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(320);
  const googleButtonHostRef = useRef<HTMLDivElement | null>(null);
  const { login, loginWithGoogle, loginWithOtp, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = redirectProp ?? (searchParams.get("redirect") || "/");

  const navigateAfterAuth = useCallback(() => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push(redirect);
  }, [onSuccess, redirect, router]);

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpResendResetKey, setOtpResendResetKey] = useState(0);
  const [otpResendCooldownSec, setOtpResendCooldownSec] = useState(DEFAULT_OTP_COOLDOWN_SEC);
  const [otpVerifyCooldownSec, setOtpVerifyCooldownSec] = useState(0);
  const [pendingCopy, setPendingCopy] = useState<PendingCopy>({
    title: "Please wait",
    description: "We are preparing your secure sign-in session.",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const otpEmailForm = useForm<OtpEmailForm>({
    resolver: zodResolver(otpEmailSchema),
  });

  const otpCodeForm = useForm<OtpCodeForm>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (otpVerifyCooldownSec <= 0) return;
    const id = window.setTimeout(() => {
      setOtpVerifyCooldownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [otpVerifyCooldownSec]);

  const onSendLoginOtp = async (data: OtpEmailForm) => {
    setOtpSending(true);
    setPendingCopy({
      title: "Sending sign-in code",
      description: "Checking your account and delivering OTP to your inbox.",
    });
    try {
      const res = await authApi.sendOtp({ type: "login", email: data.email });
      setOtpEmail(data.email);
      setOtpResendCooldownSec(otpRetryAfterFromSuccess(res));
      setOtpResendResetKey((k) => k + 1);
      setOtpVerifyCooldownSec(0);
      setOtpStep("code");
      toast.success("We sent a sign-in code to your email.");
    } catch (err: unknown) {
      const { message, retryAfter } = parseApiClientError(err);
      if (retryAfter) setOtpResendCooldownSec(retryAfter);
      toast.error(formatOtpRetryMessage(message, retryAfter));
    } finally {
      setOtpSending(false);
    }
  };

  const onVerifyLoginOtp = async (data: OtpCodeForm) => {
    if (otpVerifyCooldownSec > 0) return;
    setPendingCopy({
      title: "Verifying code",
      description: "Finalizing sign-in and restoring your secure session.",
    });
    try {
      await loginWithOtp(otpEmail, data.otp);
      setOtpVerifyCooldownSec(0);
      toast.success("Welcome back!");
      navigateAfterAuth();
    } catch (err: unknown) {
      if (err instanceof ApiValidationError) {
        toast.error(
          "The server response could not be read. Try again or use password sign-in.",
        );
        return;
      }
      const { message, retryAfter } = parseApiClientError(err);
      if (retryAfter) setOtpVerifyCooldownSec(retryAfter);
      toast.error(formatOtpRetryMessage(message, retryAfter));
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setPendingCopy({
      title: "Signing you in",
      description: "Validating credentials and loading your account.",
    });
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigateAfterAuth();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (isLoading) return;
    if (!credential) {
      toast.error("Google sign-in did not return a credential.");
      return;
    }
    setPendingCopy({
      title: "Verifying Google account",
      description: "Securing your Google sign-in and preparing your session.",
    });
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome back!");
      navigateAfterAuth();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  const updateGoogleButtonWidth = useCallback(() => {
    const hostWidth = googleButtonHostRef.current?.clientWidth || 0;
    setGoogleButtonWidth(Math.max(230, hostWidth || 320));
  }, []);

  useEffect(() => {
    updateGoogleButtonWidth();
    setGoogleUiReady(true);
  }, [updateGoogleButtonWidth]);

  useEffect(() => {
    if (!googleUiReady) return;
    const host = googleButtonHostRef.current;
    if (!host || typeof window === "undefined") return;
    const observer = new ResizeObserver(() => updateGoogleButtonWidth());
    observer.observe(host);
    const onResize = () => updateGoogleButtonWidth();
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [googleUiReady, updateGoogleButtonWidth]);

  const googleBlock =
    googleClientId ?
      <div ref={googleButtonHostRef} className="w-full overflow-hidden min-h-[40px]">
        {googleUiReady ?
          <GoogleLogin
            theme="outline"
            size="large"
            width={googleButtonWidth}
            text="continue_with"
            shape="rectangular"
            logo_alignment="center"
            use_fedcm_for_button={false}
            onSuccess={(cred) => void handleGoogle(cred.credential)}
            onError={() => toast.error("Google sign-in was cancelled or failed.")}
          />
        : null}
      </div>
    : null;

  if (loginMode === "otp") {
    if (otpStep === "code") {
      const isPending = isLoading || otpSending;
      return (
        <>
          <AuthFormRoot embedded={embedded}>
            <AuthFormHeader
              embedded={embedded}
              title="Enter sign-in code"
              subtitle={`Code sent to ${otpEmail}`}
              icon={<Mail className="h-5 w-5" />}
            />
            <form onSubmit={otpCodeForm.handleSubmit(onVerifyLoginOtp)} className="space-y-3">
              <Input
                {...otpCodeForm.register("otp")}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                label="6-digit code"
                placeholder="000000"
                error={otpCodeForm.formState.errors.otp?.message}
              />
              <OtpResendCooldown
                email={otpEmail}
                type="login"
                resetKey={otpResendResetKey}
                initialSeconds={otpResendCooldownSec}
              />
              {otpVerifyCooldownSec > 0 && (
                <p className="text-center text-sm text-amber-700">
                  Too many attempts. Try again in {otpVerifyCooldownSec}s.
                </p>
              )}
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                loading={isLoading}
                disabled={otpVerifyCooldownSec > 0}
              >
                {otpVerifyCooldownSec > 0 ? `Sign in in ${otpVerifyCooldownSec}s` : "Sign in"}
              </Button>
              <AuthBackButton
                embedded={embedded}
                onClick={() => {
                  setOtpStep("email");
                  otpCodeForm.reset();
                }}
              >
                ← Use a different email
              </AuthBackButton>
              <AuthBackButton
                embedded={embedded}
                onClick={() => {
                  setLoginMode("password");
                  setOtpStep("email");
                }}
              >
                Sign in with password instead
              </AuthBackButton>
            </form>
          </AuthFormRoot>
          <AuthPendingOverlay active={isPending} title={pendingCopy.title} description={pendingCopy.description} />
        </>
      );
    }

    const isPending = isLoading || otpSending;
    return (
      <>
        <AuthFormRoot embedded={embedded}>
          <AuthFormHeader
            embedded={embedded}
            title="Email sign-in code"
            subtitle="We will send a one-time 6-digit code"
          />
          <form onSubmit={otpEmailForm.handleSubmit(onSendLoginOtp)} className="space-y-3">
            <Input
              {...otpEmailForm.register("email")}
              type="email"
              label="Email"
              placeholder="you@example.com"
              error={otpEmailForm.formState.errors.email?.message}
              autoComplete="email"
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={otpSending}>
              Send code
            </Button>
            <AuthBackButton embedded={embedded} onClick={() => setLoginMode("password")}>
              ← Back to password sign-in
            </AuthBackButton>
          </form>
        </AuthFormRoot>
        <AuthPendingOverlay active={isPending} title={pendingCopy.title} description={pendingCopy.description} />
      </>
    );
  }

  const isPending = isLoading || otpSending;
  return (
    <>
      <AuthFormRoot embedded={embedded}>
        <AuthFormHeader
          embedded={embedded}
          title="Sign in to The House of Rani"
          subtitle={embedded ? undefined : "Sign in to continue shopping"}
        />

        {googleBlock}
        {googleClientId ? <AuthFormDivider embedded={embedded} label="or email" /> : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
          />
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Your password"
              error={errors.password?.message}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setLoginMode("otp")}
              className={authGhostBtn(embedded)}
            >
              Use email code instead
            </button>
            <AuthNavLink
              embedded={embedded}
              onNavigate={onForgotPassword}
              href="/auth/forgot-password"
              className={authLinkText(embedded)}
            >
              Forgot password?
            </AuthNavLink>
          </div>
          <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign in
          </Button>
        </form>

        <AuthFormFooter embedded={embedded}>
          Don&apos;t have an account?{" "}
          <AuthNavLink
            embedded={embedded}
            onNavigate={onSwitchToSignup}
            href="/auth/signup"
            className={authLinkText(embedded)}
          >
            Create one
          </AuthNavLink>
        </AuthFormFooter>
      </AuthFormRoot>
      <AuthPendingOverlay active={isPending} title={pendingCopy.title} description={pendingCopy.description} />
    </>
  );
}

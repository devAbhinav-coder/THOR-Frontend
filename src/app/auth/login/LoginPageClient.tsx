"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthNavLink from "@/components/auth/AuthNavLink";
import AuthGoogleButton from "@/components/auth/AuthGoogleButton";
import AuthLegalNotice from "@/components/auth/AuthLegalNotice";
import {
  AuthFormRoot,
  AuthFormHeader,
  AuthFormDivider,
  AuthFormFooter,
  AuthBackButton,
} from "@/components/auth/AuthFormChrome";
import AuthField from "@/components/auth/AuthField";
import { authLinkText, authGhostBtn, authPrimaryBtn } from "@/lib/authFormShell";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authFieldLabel } from "@/lib/authHeritageTheme";
import { z } from "zod";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import AuthPendingOverlay from "@/components/auth/AuthPendingOverlay";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { useTurnstileToken } from "@/hooks/useTurnstileToken";
import { ApiValidationError } from "@/lib/parseApi";
import {
  DEFAULT_OTP_COOLDOWN_SEC,
  formatOtpRetryMessage,
  otpRetryAfterFromSuccess,
  parseApiClientError,
} from "@/lib/authOtpClient";
import { safeRedirectPath } from "@/lib/safeRedirect";

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
  const { login, loginWithGoogle, loginWithOtp, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    safeRedirectPath(redirectProp ?? searchParams.get("redirect")) || "/";

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
  const turnstile = useTurnstileToken();

  // Drop tokens when the auth step remounts a fresh widget (single-use).
  useEffect(() => {
    turnstile.setToken(undefined);
  }, [loginMode, otpStep]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const turnstileToken = turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setOtpSending(true);
    setPendingCopy({
      title: "Sending sign-in code",
      description: "Checking your account and delivering OTP to your inbox.",
    });
    try {
      const res = await authApi.sendOtp({
        type: "login",
        email: data.email,
        turnstileToken,
      });
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
    const turnstileToken = turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setPendingCopy({
      title: "Verifying code",
      description: "Finalizing sign-in and restoring your secure session.",
    });
    try {
      await loginWithOtp(otpEmail, data.otp, turnstileToken);
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
    const turnstileToken = turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setPendingCopy({
      title: "Signing you in",
      description: "Validating credentials and loading your account.",
    });
    try {
      await login(data.email, data.password, turnstileToken);
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
    const turnstileToken = turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setPendingCopy({
      title: "Verifying Google account",
      description: "Securing your Google sign-in and preparing your session.",
    });
    try {
      await loginWithGoogle(credential, turnstileToken);
      toast.success("Welcome back!");
      navigateAfterAuth();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  const googleBlock =
    googleClientId ?
      <AuthGoogleButton
        mode="login"
        onSuccess={(credential) => void handleGoogle(credential)}
        onError={() => toast.error("Google sign-in was cancelled or failed.")}
      />
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
            <form onSubmit={otpCodeForm.handleSubmit(onVerifyLoginOtp)} className="space-y-4">
              <div className="space-y-2 pb-2">
                <label className={authFieldLabel(embedded)}>6-digit code</label>
                <Controller
                  control={otpCodeForm.control}
                  name="otp"
                  render={({ field }) => (
                    <InputOTP 
                      maxLength={6} 
                      {...field}
                    >
                      <InputOTPGroup className="w-full justify-between gap-1 sm:gap-2">
                        <InputOTPSlot index={0} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                        <InputOTPSlot index={1} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                        <InputOTPSlot index={2} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                        <InputOTPSlot index={3} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                        <InputOTPSlot index={4} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                        <InputOTPSlot index={5} className="w-10 h-11 sm:w-12 sm:h-12 text-lg bg-navy-50/50" />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
                {otpCodeForm.formState.errors.otp?.message && (
                  <p className="text-xs text-red-600">{otpCodeForm.formState.errors.otp.message}</p>
                )}
              </div>
              <OtpResendCooldown
                email={otpEmail}
                type="login"
                resetKey={otpResendResetKey}
                initialSeconds={otpResendCooldownSec}
                consumeTurnstile={turnstile.consumeOrToast}
              />
              <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
              {otpVerifyCooldownSec > 0 && (
                <p className="text-center text-sm text-amber-700">
                  Too many attempts. Try again in {otpVerifyCooldownSec}s.
                </p>
              )}
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className={authPrimaryBtn()}
                loading={isLoading}
                disabled={otpVerifyCooldownSec > 0}
              >
                {otpVerifyCooldownSec > 0 ? `Sign in in ${otpVerifyCooldownSec}s` : "Enter the House"}
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
          <form onSubmit={otpEmailForm.handleSubmit(onSendLoginOtp)} className="space-y-4">
            <AuthField
              embedded={embedded}
              {...otpEmailForm.register("email")}
              type="email"
              label="Email address"
              placeholder="your@email.com"
              error={otpEmailForm.formState.errors.email?.message}
              autoComplete="email"
            />
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button type="submit" variant="brand" size="lg" className={authPrimaryBtn()} loading={otpSending}>
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
        {!embedded && (
          <AuthFormHeader
            embedded={embedded}
            title="Sign in to The House of Rani"
            subtitle="Sign in to continue shopping"
          />
        )}

        <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />

        {googleBlock}
        {googleClientId ? <AuthFormDivider embedded={embedded} label="or email" /> : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <AuthField
            embedded={embedded}
            {...register("email")}
            type="email"
            label="Email address"
            placeholder="your@email.com"
            error={errors.email?.message}
            autoComplete="email"
          />
          <AuthField
            embedded={embedded}
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Your password"
            error={errors.password?.message}
            autoComplete="current-password"
            labelAction={
              <AuthNavLink
                embedded={embedded}
                onNavigate={onForgotPassword}
                href="/auth/forgot-password"
                className={authLinkText(embedded)}
              >
                Forgot?
              </AuthNavLink>
            }
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 transition-colors hover:text-navy-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex items-center justify-start pt-0.5">
            <button
              type="button"
              onClick={() => setLoginMode("otp")}
              className={authGhostBtn(embedded)}
            >
              Use email code instead
            </button>
          </div>
          <Button type="submit" variant="brand" size="lg" className={authPrimaryBtn()} loading={isLoading}>
            Enter the House
          </Button>
        </form>

        <AuthFormFooter embedded={embedded}>
          {embedded ?
            <>
              Not yet part of our legacy?{" "}
              <AuthNavLink
                embedded={embedded}
                onNavigate={onSwitchToSignup}
                href="/auth/signup"
                className={authLinkText(embedded)}
              >
                Create Account
              </AuthNavLink>
            </>
          : <>
              Don&apos;t have an account?{" "}
              <AuthNavLink
                embedded={embedded}
                onNavigate={onSwitchToSignup}
                href="/auth/signup"
                className={authLinkText(embedded)}
              >
                Create one
              </AuthNavLink>
            </>
          }
        </AuthFormFooter>
        <AuthLegalNotice mode="signin" />
      </AuthFormRoot>
      <AuthPendingOverlay active={isPending} title={pendingCopy.title} description={pendingCopy.description} />
    </>
  );
}

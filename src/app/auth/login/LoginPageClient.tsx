"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ApiValidationError } from "@/lib/parseApi";

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

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function googleIframeWidth(): number {
  if (typeof window === "undefined") return 320;
  const viewport = window.innerWidth;
  if (viewport < 380) return 230;
  if (viewport < 430) return 250;
  if (viewport < 500) return 280;
  return 320;
}

export default function LoginPageClient() {
  const [showPassword, setShowPassword] = useState(false);
  /** GSI re-inits on every `width` change — render only after mount so width is stable (fixes first-click failures). */
  const [googleUiReady, setGoogleUiReady] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(320);
  const { login, loginWithGoogle, loginWithOtp, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSending, setOtpSending] = useState(false);

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

  const onSendLoginOtp = async (data: OtpEmailForm) => {
    setOtpSending(true);
    try {
      await authApi.sendOtp({ type: "login", email: data.email });
      setOtpEmail(data.email);
      setOtpStep("code");
      toast.success("We sent a sign-in code to your email.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Could not send sign-in code.");
    } finally {
      setOtpSending(false);
    }
  };

  const onVerifyLoginOtp = async (data: OtpCodeForm) => {
    try {
      await loginWithOtp(otpEmail, data.otp);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      if (err instanceof ApiValidationError) {
        toast.error(
          "The server response could not be read. Try again or use password sign-in.",
        );
        return;
      }
      const error = err as { message?: string };
      toast.error(error.message || "Invalid or expired code.");
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push(redirect);
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
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  const updateGoogleButtonWidth = useCallback(() => {
    setGoogleButtonWidth(googleIframeWidth());
  }, []);

  useEffect(() => {
    setGoogleButtonWidth(googleIframeWidth());
    setGoogleUiReady(true);
  }, []);

  useEffect(() => {
    if (!googleUiReady) return;
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(updateGoogleButtonWidth, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [googleUiReady, updateGoogleButtonWidth]);

  if (loginMode === "otp") {
    if (otpStep === "code") {
      return (
        <div className="w-full max-w-md">
          <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">Enter sign-in code</h2>
              <p className="text-white/50 mt-2 text-sm">
                Code sent to <span className="text-white/80 font-medium">{otpEmail}</span>
              </p>
            </div>
            <form onSubmit={otpCodeForm.handleSubmit(onVerifyLoginOtp)} className="space-y-4">
              <Input
                {...otpCodeForm.register("otp")}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                label="6-digit code"
                placeholder="000000"
                error={otpCodeForm.formState.errors.otp?.message}
              />
              <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
                Sign in
              </Button>
              <OtpResendCooldown email={otpEmail} type="login" />
              <button
                type="button"
                onClick={() => {
                  setOtpStep("email");
                  otpCodeForm.reset();
                }}
                className="w-full text-sm text-white/40 hover:text-white/70"
              >
                ← Use a different email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("password");
                  setOtpStep("email");
                }}
                className="w-full text-sm text-white/30 hover:text-white/50"
              >
                Sign in with password instead
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md">
        <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white [&_input::placeholder]:text-white/30 [&_input:focus]:border-brand-600">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-white">Email sign-in code</h2>
            <p className="text-white/50 mt-1 text-sm">We&apos;ll email you a one-time 6-digit code</p>
          </div>
          <form onSubmit={otpEmailForm.handleSubmit(onSendLoginOtp)} className="space-y-4">
            <Input
              {...otpEmailForm.register("email")}
              type="email"
              label="Email address"
              placeholder="you@example.com"
              error={otpEmailForm.formState.errors.email?.message}
              autoComplete="email"
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={otpSending}>
              Send code
            </Button>
            <button
              type="button"
              onClick={() => setLoginMode("password")}
              className="w-full text-sm text-white/40 hover:text-white/70"
            >
              ← Back to password sign-in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white [&_input::placeholder]:text-white/30 [&_input:focus]:border-brand-600">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">Welcome back</h2>
          <p className="text-white/50 mt-1 text-sm">Sign in to your account to continue</p>
        </div>

        <button
          type="button"
          onClick={() => setLoginMode("otp")}
          className="mb-4 w-full rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
        >
          Sign in with email code
        </button>

        {googleClientId ? (
          <div className="mb-6 w-full flex flex-col items-center overflow-hidden min-h-[40px]">
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
        ) : (
          <p className="mb-6 text-center text-[11px] text-white/35">
            Google sign-in is not configured (set NEXT_PUBLIC_GOOGLE_CLIENT_ID).
          </p>
        )}

        {googleClientId ? (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-navy-900 px-3 text-white/35">or email</span>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("email")}
            type="email"
            label="Email Address"
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
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

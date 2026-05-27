"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthNavLink from "@/components/auth/AuthNavLink";
import {
  AuthFormRoot,
  AuthFormHeader,
  AuthFormDivider,
  AuthFormFooter,
  AuthBackButton,
  AuthStepBar,
} from "@/components/auth/AuthFormChrome";
import { authLinkText } from "@/lib/authFormShell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Eye, EyeOff, UserPlus, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import AuthPendingOverlay from "@/components/auth/AuthPendingOverlay";
import { ApiValidationError } from "@/lib/parseApi";

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/(?=.*[a-z])/, "Include a lowercase letter")
  .regex(/(?=.*[A-Z])/, "Include an uppercase letter")
  .regex(/(?=.*\d)/, "Include a number");

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone is required")
      .refine(
        (val) => {
          const d = val.replace(/\D/g, "");
          if (d.length !== 10 || !/^[6-9]/.test(d)) return false;
          return isValidPhoneNumber(`+91${d}`, "IN");
        },
        { message: "Enter a valid Indian mobile number" },
      ),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

type OtpForm = z.infer<typeof otpSchema>;
type PendingCopy = { title: string; description: string };

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type SignupPageClientProps = {
  embedded?: boolean;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
};

export default function SignupPageClient({
  embedded = false,
  onSuccess,
  onSwitchToLogin,
}: SignupPageClientProps = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [googleUiReady, setGoogleUiReady] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(320);
  const googleButtonHostRef = useRef<HTMLDivElement | null>(null);
  const [wizardStep, setWizardStep] = useState<"details" | "password" | "otp">(
    "details",
  );
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingCopy, setPendingCopy] = useState<PendingCopy>({
    title: "Please wait",
    description: "We are preparing your secure authentication session.",
  });
  const { signupStart, signupVerify, loginWithGoogle, isLoading } =
    useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const navigateAfterAuth = useCallback(() => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push(redirect);
  }, [onSuccess, redirect, router]);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmitForm = async (data: SignupForm) => {
    setPendingCopy({
      title: "Sending verification code",
      description: "Creating your secure signup session and delivering OTP.",
    });
    try {
      const phoneDigits = data.phone.replace(/\D/g, "");
      await signupStart({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: phoneDigits,
      });
      setPendingEmail(data.email);
      setWizardStep("otp");
      toast.success("We sent a 6-digit code to your email.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Could not send verification email.");
    }
  };

  const onSubmitOtp = async (data: OtpForm) => {
    setPendingCopy({
      title: "Verifying your email",
      description: "Final checks in progress before creating your account.",
    });
    try {
      await signupVerify(pendingEmail, data.otp);
      toast.success("Account verified. Welcome to The House of Rani!");
      navigateAfterAuth();
    } catch (err: unknown) {
      if (err instanceof ApiValidationError) {
        toast.error(
          "The server response could not be read. If your account was created, try signing in with your email and password.",
        );
        return;
      }
      const error = err as { message?: string };
      toast.error(error.message || "Invalid or expired code.");
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (isLoading) return;
    if (!credential) {
      toast.error("Google sign-up did not return a credential.");
      return;
    }
    setPendingCopy({
      title: "Verifying Google account",
      description: "Securing Google sign-up and preparing your account.",
    });
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome! Your account is ready.");
      navigateAfterAuth();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-up failed.");
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

  const onContinueDetails = async () => {
    const ok = await form.trigger(["name", "email", "phone"]);
    if (ok) setWizardStep("password");
  };

  const stepIndex =
    wizardStep === "details" ? 0 : wizardStep === "password" ? 1 : 2;

  const googleBlock =
    googleClientId ?
      <div ref={googleButtonHostRef} className="w-full overflow-hidden min-h-[40px]">
        {googleUiReady ?
          <GoogleLogin
            theme="outline"
            size="large"
            width={googleButtonWidth}
            text="signup_with"
            shape="rectangular"
            logo_alignment="center"
            use_fedcm_for_button={false}
            onSuccess={(cred) => void handleGoogle(cred.credential)}
            onError={() => toast.error("Google sign-up was cancelled or failed.")}
          />
        : null}
      </div>
    : null;

  const termsLine = (
    <p className="mt-4 text-center text-[10px] leading-snug text-gray-400">
      By signing up you agree to our{" "}
      <Link href="/terms" className="text-gray-500 hover:text-brand-600 hover:underline">
        Terms
      </Link>
      ,{" "}
      <Link href="/privacy" className="text-gray-500 hover:text-brand-600 hover:underline">
        Privacy
      </Link>
      , and{" "}
      <Link href="/returns" className="text-gray-500 hover:text-brand-600 hover:underline">
        Returns
      </Link>
      .
    </p>
  );

  if (wizardStep === "otp") {
    const isPending = isLoading;
    return (
      <>
        <AuthFormRoot embedded={embedded}>
          {embedded ? <AuthStepBar total={3} current={2} /> : null}
          <AuthFormHeader
            embedded={embedded}
            title="Verify your email"
            subtitle={`Enter the code sent to ${pendingEmail}`}
            icon={<Mail className="h-5 w-5" />}
          />
          <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-3">
            <Input
              {...otpForm.register("otp")}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              label="Verification code"
              placeholder="000000"
              error={otpForm.formState.errors.otp?.message}
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
              Verify & create account
            </Button>
            <OtpResendCooldown email={pendingEmail} type="signup" />
            <AuthBackButton
              embedded={embedded}
              onClick={() => {
                setWizardStep("password");
                otpForm.reset();
              }}
            >
              ← Back to password step
            </AuthBackButton>
          </form>
        </AuthFormRoot>
        <AuthPendingOverlay
          active={isPending}
          title={pendingCopy.title}
          description={pendingCopy.description}
        />
      </>
    );
  }

  if (wizardStep === "password") {
    const isPending = isLoading;
    return (
      <>
        <AuthFormRoot embedded={embedded}>
          {embedded ? <AuthStepBar total={3} current={1} /> : null}
          <AuthFormHeader
            embedded={embedded}
            title="Secure your account"
            subtitle="Choose a strong password to finish setup"
          />
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-3">
            <div className="relative">
              <Input
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Min. 8 characters"
                error={form.formState.errors.password?.message}
                autoComplete="new-password"
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
            <Input
              {...form.register("confirmPassword")}
              type="password"
              label="Confirm password"
              placeholder="Repeat password"
              error={form.formState.errors.confirmPassword?.message}
              autoComplete="new-password"
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Send verification code
            </Button>
            <AuthBackButton embedded={embedded} onClick={() => setWizardStep("details")}>
              ← Back to your details
            </AuthBackButton>
          </form>
        </AuthFormRoot>
        <AuthPendingOverlay
          active={isPending}
          title={pendingCopy.title}
          description={pendingCopy.description}
        />
      </>
    );
  }

  const isPending = isLoading;
  return (
    <>
      <AuthFormRoot embedded={embedded}>
        {embedded ? <AuthStepBar total={3} current={stepIndex} /> : null}
        <AuthFormHeader
          embedded={embedded}
          title="Create your House of Rani account"
          subtitle={embedded ? undefined : "Join us — verify your email to finish"}
        />

        {googleBlock}
        {googleClientId ? <AuthFormDivider embedded={embedded} label="or email" /> : null}

        <div className="space-y-3">
          <Input
            {...form.register("name")}
            label="Full name"
            placeholder="Your name"
            error={form.formState.errors.name?.message}
            autoComplete="name"
          />
          <Input
            {...form.register("email")}
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={form.formState.errors.email?.message}
            autoComplete="email"
          />
          <Input
            {...form.register("phone")}
            type="tel"
            label="Mobile (India)"
            placeholder="10-digit number"
            error={form.formState.errors.phone?.message}
            maxLength={10}
            hint="For order updates & delivery"
          />
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="w-full"
            onClick={() => void onContinueDetails()}
          >
            Continue
          </Button>
        </div>

        <AuthFormFooter embedded={embedded}>
          Already have an account?{" "}
          <AuthNavLink
            embedded={embedded}
            onNavigate={onSwitchToLogin}
            href="/auth/login"
            className={authLinkText(embedded)}
          >
            Sign in
          </AuthNavLink>
        </AuthFormFooter>
        {termsLine}
      </AuthFormRoot>
      <AuthPendingOverlay
        active={isPending}
        title={pendingCopy.title}
        description={pendingCopy.description}
      />
    </>
  );
}

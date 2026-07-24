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
  AuthStepBar,
} from "@/components/auth/AuthFormChrome";
import AuthField from "@/components/auth/AuthField";
import { authLinkText, authPrimaryBtn } from "@/lib/authFormShell";
import { useForm, Controller } from "react-hook-form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authFieldLabel } from "@/lib/authHeritageTheme";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import AuthPendingOverlay from "@/components/auth/AuthPendingOverlay";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { useTurnstileToken } from "@/hooks/useTurnstileToken";
import { ApiValidationError } from "@/lib/parseApi";
import { safeRedirectPath } from "@/lib/safeRedirect";

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
  const turnstile = useTurnstileToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect")) || "/";

  useEffect(() => {
    turnstile.setToken(undefined);
  }, [wizardStep]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const turnstileToken = await turnstile.consumeOrToast();
    if (!turnstileToken) return;
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
        turnstileToken,
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
    const turnstileToken = await turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setPendingCopy({
      title: "Verifying your email",
      description: "Final checks in progress before creating your account.",
    });
    try {
      await signupVerify(pendingEmail, data.otp, turnstileToken);
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
    const turnstileToken = await turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setPendingCopy({
      title: "Verifying Google account",
      description: "Securing Google sign-up and preparing your account.",
    });
    try {
      await loginWithGoogle(credential, turnstileToken);
      toast.success("Welcome! Your account is ready.");
      navigateAfterAuth();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-up failed.");
    }
  };

  const onContinueDetails = async () => {
    const ok = await form.trigger(["name", "email", "phone"]);
    if (ok) setWizardStep("password");
  };

  const stepIndex =
    wizardStep === "details" ? 0 : wizardStep === "password" ? 1 : 2;

  const googleBlock =
    googleClientId ?
      <AuthGoogleButton
        mode="signup"
        onSuccess={(credential) => void handleGoogle(credential)}
        onError={() => toast.error("Google sign-up was cancelled or failed.")}
      />
    : null;

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
            <div className="space-y-2 pb-2">
              <label className={authFieldLabel(embedded)}>6-digit code</label>
              <Controller
                control={otpForm.control}
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
              {otpForm.formState.errors.otp?.message && (
                <p className="text-xs text-red-600">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button type="submit" variant="brand" size="lg" className={authPrimaryBtn()} loading={isLoading}>
              Verify & create account
            </Button>
            <OtpResendCooldown
              email={pendingEmail}
              type="signup"
              consumeTurnstile={turnstile.consumeOrToast}
            />
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
            <AuthField
              embedded={embedded}
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Min. 8 characters"
              error={form.formState.errors.password?.message}
              autoComplete="new-password"
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
            <AuthField
              embedded={embedded}
              {...form.register("confirmPassword")}
              type="password"
              label="Confirm password"
              placeholder="Repeat password"
              error={form.formState.errors.confirmPassword?.message}
              autoComplete="new-password"
            />
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button type="submit" variant="brand" size="lg" className={authPrimaryBtn()} loading={isLoading}>
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
        {!embedded && <AuthStepBar total={3} current={stepIndex} />}

        {!embedded && (
          <AuthFormHeader
            embedded={embedded}
            title="Create your House of Rani account"
            subtitle="Join us — verify your email to finish"
          />
        )}

        <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />

        {googleBlock}
        {googleClientId ? <AuthFormDivider embedded={embedded} label="or email" /> : null}

        <div className="space-y-2.5">
          <AuthField
            embedded={embedded}
            {...form.register("name")}
            label="Full name"
            placeholder="Your name"
            error={form.formState.errors.name?.message}
            autoComplete="name"
          />
          <AuthField
            embedded={embedded}
            {...form.register("email")}
            type="email"
            label="Email address"
            placeholder="your@email.com"
            error={form.formState.errors.email?.message}
            autoComplete="email"
          />
          <AuthField
            embedded={embedded}
            {...form.register("phone")}
            type="tel"
            label="Mobile"
            placeholder="10-digit number"
            error={form.formState.errors.phone?.message}
            maxLength={10}
          />
          <Button
            type="button"
            variant="brand"
            size="lg"
            className={authPrimaryBtn()}
            onClick={() => void onContinueDetails()}
          >
            Continue
          </Button>
        </div>

        <AuthFormFooter embedded={embedded}>
          Already part of our legacy?{" "}
          <AuthNavLink
            embedded={embedded}
            onNavigate={onSwitchToLogin}
            href="/auth/login"
            className={authLinkText(embedded)}
          >
            Sign In
          </AuthNavLink>
        </AuthFormFooter>
        <AuthLegalNotice mode="signup" />
      </AuthFormRoot>
      <AuthPendingOverlay
        active={isPending}
        title={pendingCopy.title}
        description={pendingCopy.description}
      />
    </>
  );
}

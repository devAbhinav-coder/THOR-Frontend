"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { mergeGuestCartFromStorage } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import AuthField from "@/components/auth/AuthField";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { useTurnstileToken } from "@/hooks/useTurnstileToken";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { authPrimaryBtn } from "@/lib/authFormShell";
import { heritageSectionCard } from "@/components/checkout/checkoutHeritageTheme";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

type Props = {
  onVerified: () => void;
};

export default function GuestCheckoutEmailGate({ onVerified }: Props) {
  const establishSession = useAuthStore((s) => s.establishSession);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const turnstile = useTurnstileToken();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const sendCode = useCallback(async () => {
    const ok = await emailForm.trigger("email");
    if (!ok) return;
    const turnstileToken = await turnstile.consumeOrToast();
    if (!turnstileToken) return;
    const email = emailForm.getValues("email").trim().toLowerCase();
    setSending(true);
    try {
      await authApi.sendOtp({
        type: "guest_checkout",
        email,
        turnstileToken,
      });
      turnstile.reset();
      setPendingEmail(email);
      setStep("otp");
      toast.success("Verification code sent to your email.");
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number };
      if (err.status === 409) {
        toast.error(err.message || "Please sign in with this email.");
      } else {
        toast.error(err.message || "Could not send code. Try again.");
      }
    } finally {
      setSending(false);
    }
  }, [emailForm, turnstile]);

  const verifyCode = useCallback(async () => {
    const ok = await otpForm.trigger("otp");
    if (!ok || !pendingEmail) return;
    const turnstileToken = await turnstile.consumeOrToast();
    if (!turnstileToken) return;
    setVerifying(true);
    try {
      const res = await authApi.verifyOtpGuestCheckout({
        email: pendingEmail,
        otp: otpForm.getValues("otp"),
        turnstileToken,
      });
      turnstile.reset();
      if (res.data.user) {
        establishSession(res.data.user);
      }
      await mergeGuestCartFromStorage();
      toast.success("Email verified — continue checkout.");
      onVerified();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  }, [otpForm, pendingEmail, onVerified, establishSession, turnstile]);

  return (
    <div className='mx-auto w-full max-w-lg px-4 py-10 sm:py-14'>
      <div className={`${heritageSectionCard} p-6 sm:p-8`}>
        <div className='mb-6 flex items-center gap-3'>
          <span className='flex h-10 w-10 items-center justify-center border border-[#c5a059]/40 bg-[#faf8f5]'>
            <Mail className='h-5 w-5 text-[#c5a059]' strokeWidth={1.25} />
          </span>
          <div>
            <h1 className='font-serif text-2xl font-semibold text-navy-900'>
              Guest checkout
            </h1>
            <p className='text-sm text-gray-600'>
              Verify your email with a one-time code. Orders link to this inbox;
              you can create a password anytime.
            </p>
          </div>
        </div>

        {step === "email" ?
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <AuthField
              label='Email'
              {...emailForm.register("email")}
              type='email'
              autoComplete='email'
              placeholder='your@email.com'
              error={emailForm.formState.errors.email?.message}
            />
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button
              type='submit'
              disabled={sending}
              className={authPrimaryBtn("w-full")}
            >
              {sending ? "Sending…" : "Send verification code"}
            </Button>
            <p className='text-center text-xs text-gray-500'>
              Already have an account?{" "}
              <Link
                href={loginUrlWithRedirect("/checkout")}
                className='font-medium text-navy-900 underline-offset-2 hover:underline'
              >
                Sign in
              </Link>
            </p>
          </form>
        : <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            <p className='text-sm text-gray-600'>
              Code sent to{" "}
              <span className='font-medium text-navy-900'>{pendingEmail}</span>
            </p>
            <Controller
              control={otpForm.control}
              name='otp'
              render={({ field }) => (
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {otpForm.formState.errors.otp ?
              <p className='text-xs text-red-600'>
                {otpForm.formState.errors.otp.message}
              </p>
            : null}
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button
              type='submit'
              disabled={verifying}
              className={authPrimaryBtn("w-full")}
            >
              {verifying ? "Verifying…" : "Verify & continue"}
            </Button>
            <OtpResendCooldown
              email={pendingEmail}
              type='guest_checkout'
              consumeTurnstile={() => turnstile.consumeOrToast()}
            />
            <button
              type='button'
              className='w-full text-center text-xs text-gray-500 underline-offset-2 hover:underline'
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </form>
        }
      </div>
    </div>
  );
}

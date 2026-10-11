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
import { Input } from "@/components/ui/input";
import { OtpResendCooldown } from "@/components/auth/OtpResendCooldown";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { useTurnstileToken } from "@/hooks/useTurnstileToken";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { cn } from "@/lib/utils";
import {
  heritageCta,
  heritageSummaryCard,
  checkoutRingClass,
} from "@/components/checkout/checkoutHeritageTheme";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const otpSlotClass =
  "h-11 w-10 flex-1 max-w-[3rem] rounded-none border-gray-300 bg-white text-lg font-semibold text-navy-900 first:rounded-none last:rounded-none sm:h-12 sm:w-12 sm:max-w-[3.25rem]";

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
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <div className={cn(heritageSummaryCard, "overflow-hidden")}>
        <div className="mb-6 flex gap-2">
          <span
            className={cn(
              "h-1 flex-1 transition-colors",
              step === "email" ? "bg-[#c5a059]" : "bg-gray-200",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "h-1 flex-1 transition-colors",
              step === "otp" ? "bg-[#c5a059]" : "bg-gray-200",
            )}
            aria-hidden
          />
        </div>

        <div className="mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c5a059]/40 bg-[#faf8f5]">
              <Mail
                className="h-5 w-5 text-[#c5a059]"
                strokeWidth={1.25}
                aria-hidden
              />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c5a059]">
                {step === "email" ? "Step 1 of 2" : "Step 2 of 2"}
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-navy-900 sm:text-[1.65rem]">
                {step === "email" ? "Guest checkout" : "Verify your email"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step === "email" ?
                  "Enter the email for order updates and receipts. We’ll send a one-time code — no password needed."
                : "Enter the 6-digit code we sent. Your cart and order will stay linked to this inbox."}
              </p>
            </div>
          </div>
        </div>

        {step === "email" ?
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <div className="border border-dashed border-gray-300 bg-[#f8f9fa]/80 p-4 sm:p-5">
              <Input
                id="guest-checkout-email"
                {...emailForm.register("email")}
                type="email"
                autoComplete="email"
                label="Email address"
                placeholder="you@example.com"
                hint="Use an inbox you can access now — we’ll send your verification code here."
                error={emailForm.formState.errors.email?.message}
                className="rounded-none border-gray-300 bg-white focus-visible:ring-[#c5a059]/40"
              />
            </div>
            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button type="submit" disabled={sending} className={heritageCta}>
              {sending ? "Sending…" : "Send verification code"}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href={loginUrlWithRedirect("/checkout")}
                className="font-semibold text-navy-900 underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        : <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            <div className="border border-gray-200/70 bg-[#f8f9fa] px-4 py-3 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Code sent to
              </p>
              <p className="mt-1 break-all text-sm font-medium text-navy-900">
                {pendingEmail}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guest-checkout-otp"
                className="block text-sm font-medium text-gray-700"
              >
                6-digit verification code
              </label>
              <Controller
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <InputOTP
                    id="guest-checkout-otp"
                    maxLength={6}
                    {...field}
                  >
                    <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className={cn(
                            otpSlotClass,
                            `focus-visible:ring-2 ${checkoutRingClass}`,
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              {otpForm.formState.errors.otp ?
                <p className="text-xs text-red-600">
                  {otpForm.formState.errors.otp.message}
                </p>
              : <p className="text-[11px] text-gray-500">
                  Check spam if you don’t see the email within a minute.
                </p>}
            </div>

            <TurnstileField ref={turnstile.ref} onToken={turnstile.setToken} />
            <Button type="submit" disabled={verifying} className={heritageCta}>
              {verifying ? "Verifying…" : "Verify & continue checkout"}
            </Button>
            <OtpResendCooldown
              email={pendingEmail}
              type="guest_checkout"
              consumeTurnstile={() => turnstile.consumeOrToast()}
            />
            <button
              type="button"
              className="w-full text-center text-sm text-gray-600 underline-offset-2 hover:text-navy-900 hover:underline"
              onClick={() => {
                setStep("email");
                otpForm.reset();
              }}
            >
              Use a different email
            </button>
          </form>
        }
      </div>
    </div>
  );
}

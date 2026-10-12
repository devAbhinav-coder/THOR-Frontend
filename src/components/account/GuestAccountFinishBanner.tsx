"use client";

import Link from "next/link";
import { KeyRound, LogIn, MailCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { readGuestCheckoutProfile } from "@/lib/guestCheckoutProfile";
import {
  guestConfirmStatusPath,
  guestVerificationCopy,
} from "@/lib/guestVerificationCopy";
import { openGuestPasswordModalUrl } from "@/lib/authModal";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { usePathname, useSearchParams } from "next/navigation";

type GuestKind = "unverified_guest" | "verified_guest_lead" | "full_account";

function resolveGuestKind(user: {
  offlineLead?: boolean;
  emailVerified?: boolean;
} | null): GuestKind | null {
  if (!user) return null;
  if (user.offlineLead) {
    return user.emailVerified === true ?
        "verified_guest_lead"
      : "unverified_guest";
  }
  return "full_account";
}

/**
 * Order detail prompts — three paths: sign in (full account), verify contact (new guest), join (verified guest).
 */
export default function GuestAccountFinishBanner() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  if (!isAuthenticated) {
    const loginHref = loginUrlWithRedirect(pathname || "/dashboard/orders");
    return (
      <div className='mb-6 border border-gray-200 bg-white px-4 py-4 sm:px-5'>
        <div className='flex gap-3 sm:items-start'>
          <LogIn className='mt-0.5 h-5 w-5 shrink-0 text-navy-900' aria-hidden />
          <div className='min-w-0 flex-1 space-y-2'>
            <p className='text-sm font-semibold text-navy-900'>
              Already have an account?
            </p>
            <p className='text-sm leading-relaxed text-gray-600'>
              Sign in with the email you used at checkout to stay updated on
              this order. {guestVerificationCopy.bannerLoggedOutGuest}
            </p>
            <Link
              href={loginHref}
              className='inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-900 underline-offset-4 hover:underline'
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const kind = resolveGuestKind(user);
  if (!kind || kind === "full_account") return null;

  const profile = readGuestCheckoutProfile();
  const confirmHref =
    profile?.confirmToken ?
      guestConfirmStatusPath(profile.confirmToken)
    : null;

  if (kind === "unverified_guest") {
    return (
      <div className='mb-6 border border-[#c5a059]/35 bg-[#fff8eb] px-4 py-4 sm:px-5'>
        <div className='flex gap-3 sm:items-start'>
          <MailCheck
            className='mt-0.5 h-5 w-5 shrink-0 text-[#c5a059]'
            strokeWidth={1.5}
            aria-hidden
          />
          <div className='min-w-0 flex-1 space-y-3'>
            <p className='text-sm font-semibold text-navy-900'>
              {guestVerificationCopy.bannerTitle}
            </p>
            <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800'>
              {guestVerificationCopy.statusPending}
            </p>
            <p className='text-xs leading-relaxed text-amber-950/90'>
              {guestVerificationCopy.statusPendingSub}
            </p>
            <p className='text-sm leading-relaxed text-gray-600'>
              {guestVerificationCopy.bannerBody(user.email)}
            </p>
            {confirmHref ?
              <Link
                href={confirmHref}
                className='inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-900 underline-offset-4 hover:underline'
              >
                {guestVerificationCopy.bannerCta}
              </Link>
            : <p className='text-xs text-gray-500'>
                {guestVerificationCopy.bannerInboxFallback}
              </p>
            }
          </div>
        </div>
      </div>
    );
  }

  const signupModalHref = openGuestPasswordModalUrl(
    pathname || "/dashboard/orders",
    currentSearch,
    {
      email: user.email,
      redirectPath: pathname || "/dashboard/orders",
    },
  );

  return (
    <div className='mb-6 border border-[#c5a059]/35 bg-[#fff8eb] px-4 py-4 sm:px-5'>
      <div className='flex gap-3 sm:items-start'>
        <Sparkles
          className='mt-0.5 h-5 w-5 shrink-0 text-[#c5a059]'
          strokeWidth={1.5}
          aria-hidden
        />
        <div className='min-w-0 flex-1 space-y-2'>
          <p className='text-sm font-semibold text-navy-900'>
            Stay in the loop · Join now
          </p>
          <p className='text-sm leading-relaxed text-gray-600'>
            {guestVerificationCopy.confirmedBody}
          </p>
          <div className='flex flex-col gap-2 pt-1 sm:flex-row sm:items-center'>
            <Button asChild size='sm' className='bg-navy-900 hover:bg-navy-800'>
              <Link href={signupModalHref} scroll={false}>
                <KeyRound className='mr-2 h-4 w-4' aria-hidden />
                {guestVerificationCopy.createPasswordCta}
              </Link>
            </Button>
            {confirmHref ?
              <Button asChild size='sm' variant='outline'>
                <Link href={confirmHref}>
                  {guestVerificationCopy.bannerCta}
                </Link>
              </Button>
            : null}
          </div>
        </div>
      </div>
    </div>
  );
}

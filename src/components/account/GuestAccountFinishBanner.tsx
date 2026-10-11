"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Guest checkout creates a real account with a server-only random password.
 * Session cookies keep them signed in on this device; signup sets a password for next time.
 */
export default function GuestAccountFinishBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user?.offlineLead || !user.email?.includes("@")) return null;

  const params = new URLSearchParams({
    email: user.email.trim().toLowerCase(),
    redirect: "/dashboard/orders",
  });

  return (
    <div className='mb-6 border border-[#c5a059]/35 bg-[#fff8eb] px-4 py-4 sm:px-5'>
      <div className='flex gap-3 sm:items-start'>
        <KeyRound
          className='mt-0.5 h-5 w-5 shrink-0 text-[#c5a059]'
          strokeWidth={1.5}
          aria-hidden
        />
        <div className='min-w-0 flex-1 space-y-2'>
          <p className='text-sm font-semibold text-navy-900'>
            Signed in on this device
          </p>
          <p className='text-sm leading-relaxed text-gray-600'>
            This order is saved under{" "}
            <span className='font-medium text-navy-900'>{user.email}</span>. For
            your security, we do not email temporary passwords. Set a password
            once to access your orders from any device.
          </p>
          <Link
            href={`/auth/signup?${params.toString()}`}
            className='inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-900 underline-offset-4 hover:underline'
          >
            Set account password
          </Link>
          <span className='mx-2 text-gray-300'>·</span>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent("/dashboard/orders")}`}
            className='inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-600 underline-offset-4 hover:underline'
          >
            Sign in with OTP instead
          </Link>
        </div>
      </div>
    </div>
  );
}

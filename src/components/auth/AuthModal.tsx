"use client";

import { useEffect, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brandSeo";
import type { AuthModalView } from "@/lib/authModal";
import {
  AUTH_HERO_IMAGE,
  authBackdrop,
  authFooterLinks,
  authFormPanel,
  authGoldRule,
  authHeroPanel,
  authModalEyebrow,
  authModalShell,
  authModalTitleDesktop,
  authModalTitleMobile,
} from "@/lib/authHeritageTheme";

const MOBILE_HEADINGS: Record<AuthModalView, string> = {
  login: "Sign In",
  signup: "Create Account",
  forgot: "Reset Password",
};

type Props = {
  open: boolean;
  onClose: () => void;
  view?: AuthModalView;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function AuthModal({
  open,
  onClose,
  view = "login",
  title = "Welcome Back",
  subtitle,
  children,
  className,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const mobileHeading = MOBILE_HEADINGS[view];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className={authBackdrop}
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(authModalShell, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop heritage hero */}
        <div className={authHeroPanel} aria-hidden>
          <Image
            src={AUTH_HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="420px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/35 to-navy-950/20" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className={authModalEyebrow}>Heritage Craft</p>
            <p className="mt-2 font-serif text-3xl font-semibold leading-tight text-white">
              The Art of the Drape
            </p>
          </div>
        </div>

        <div className={authFormPanel}>
          <div className="shrink-0 border-b border-gray-100 px-5 pb-3 pt-4 sm:px-7 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-col items-center text-center lg:mb-3 lg:items-start lg:text-left">
                  <Image
                    src="/logoNew.png"
                    alt={BRAND_NAME}
                    width={120}
                    height={36}
                    className="h-7 w-auto object-contain opacity-95 sm:h-8"
                  />
                </div>

                <h2
                  id={titleId}
                  className={cn(
                    authModalTitleMobile,
                    "text-[1.5rem] sm:text-[1.65rem] lg:hidden",
                  )}
                >
                  {mobileHeading}
                </h2>
                <div className={cn(authGoldRule, "mt-2 lg:hidden")} aria-hidden />

                <h2
                  className={cn(authModalTitleDesktop, "hidden lg:block")}
                >
                  {title}
                </h2>
                {subtitle ?
                  <p className="mt-1.5 hidden text-sm leading-snug text-gray-500 lg:block">
                    {subtitle}
                  </p>
                : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 text-gray-400 transition-colors hover:text-navy-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 scrollbar-hide sm:px-7 sm:py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </div>

          <div className="hidden shrink-0 border-t border-gray-100 px-8 py-4 lg:block">
            <div className="flex items-center justify-center gap-6">
              {authFooterLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400 transition-colors hover:text-[#c5a059]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  Pencil,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { guestOrderApi } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types";
import {
  heritagePageBg,
  heritageSectionCard,
} from "@/components/checkout/checkoutHeritageTheme";
import {
  readGuestCheckoutProfile,
  saveGuestCheckoutProfile,
} from "@/lib/guestCheckoutProfile";
import {
  buildGuestSignupPageHref,
  guestVerificationCopy,
} from "@/lib/guestVerificationCopy";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import GuestEmailVerificationPendingCard from "@/components/order/GuestEmailVerificationPendingCard";

type ConfirmView = {
  order: {
    _id: string;
    orderNumber: string;
    total: number;
    subtotal?: number;
    shippingCharge?: number;
    discount?: number;
    itemCount?: number;
    items?: {
      name: string;
      quantity: number;
      lineTotal: number;
      variantLabel?: string;
    }[];
    paymentMethod?: string;
    shippingAddress?: { name?: string; phone?: string };
  };
  contact: {
    name?: string;
    email: string;
    phone?: string;
    emailVerified: boolean;
    contactConfirmed: boolean;
    contactDeclined?: boolean;
  };
  confirmEmailSentAt?: string | null;
  confirmEmailSendCount?: number;
  requiresContactVerification?: boolean;
  hasRegisteredAccount?: boolean;
};

export default function GuestOrderConfirmClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlToken = searchParams.get("token")?.trim() ?? "";
  /** Yes/No only when the customer opened the link from email (not post-checkout redirect). */
  const fromEmailLink = searchParams.get("from") === "email";
  const [tokenOverride, setTokenOverride] = useState<string | null>(null);
  const [profileToken, setProfileToken] = useState("");
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const establishSession = useAuthStore((s) => s.establishSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const activeToken = tokenOverride ?? (urlToken || profileToken);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<ConfirmView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadView = useCallback(async (activeToken: string) => {
    const res = await guestOrderApi.getConfirm(activeToken);
    const data = res.data as ConfirmView;
    setView(data);
    setEditName(data.contact.name || data.order.shippingAddress?.name || "");
    setEditEmail(data.contact.email);
    setEditPhone(
      data.contact.phone || data.order.shippingAddress?.phone || "",
    );
  }, []);

  useEffect(() => {
    setProfileToken(readGuestCheckoutProfile()?.confirmToken?.trim() ?? "");
  }, []);

  useEffect(() => {
    if (urlToken || tokenOverride) return;
    const stored = readGuestCheckoutProfile()?.confirmToken?.trim();
    if (stored) {
      router.replace(
        `/order/confirm?token=${encodeURIComponent(stored)}`,
        { scroll: false },
      );
    }
  }, [urlToken, tokenOverride, router]);

  useEffect(() => {
    if (!activeToken) {
      setLoading(true);
      setError(null);
      const timer = window.setTimeout(() => {
        const stillMissing =
          !tokenOverride &&
          !searchParams.get("token")?.trim() &&
          !readGuestCheckoutProfile()?.confirmToken?.trim();
        if (stillMissing) {
          setError("This confirmation link is invalid or has expired.");
          setLoading(false);
        }
      }, 120);
      return () => window.clearTimeout(timer);
    }

    setError(null);
    setLoading(true);
    let cancelled = false;
    void loadView(activeToken)
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ?
            err.message
          : "We could not load this confirmation page.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeToken, loadView, searchParams, tokenOverride]);

  const resendEmail = useCallback(async () => {
    if (!activeToken) return;
    try {
      const res = await guestOrderApi.resendConfirmEmail(activeToken);
      const sentAt = (res.data as { sentAt?: string })?.sentAt;
      toast.success(
        sentAt ?
          guestVerificationCopy.toastResendQueued
        : guestVerificationCopy.toastResendSent,
      );
      await loadView(activeToken);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not resend email.",
      );
    }
  }, [activeToken, loadView]);

  const saveContactEdits = useCallback(async () => {
    if (!activeToken) return;
    setSubmitting(true);
    try {
      const res = await guestOrderApi.updateContact(activeToken, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.replace(/\s/g, ""),
      });
      const data = res.data as {
        token: string;
        contact: { name: string; email: string; phone?: string };
        confirmEmailSentAt?: string;
      };
      const nextToken = data.token;
      setTokenOverride(nextToken);
      saveGuestCheckoutProfile({
        email: data.contact.email,
        name: data.contact.name,
        phone: data.contact.phone,
        confirmToken: nextToken,
      });
      router.replace(
        `/order/confirm?token=${encodeURIComponent(nextToken)}`,
        { scroll: false },
      );
      await loadView(nextToken);
      setEditing(false);
      toast.success("Details updated. We sent a fresh confirmation email.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setSubmitting(false);
    }
  }, [activeToken, editName, editEmail, editPhone, loadView, router]);

  const syncSessionAfterConfirm = useCallback(async () => {
    await fetchUser().catch(() => {});
  }, [fetchUser]);

  useEffect(() => {
    if (!view?.contact.contactConfirmed) return;
    void syncSessionAfterConfirm();
  }, [view?.contact.contactConfirmed, syncSessionAfterConfirm]);

  const goToOrderDetail = useCallback(async () => {
    if (!view?.order._id) return;
    setSubmitting(true);
    try {
      await syncSessionAfterConfirm();
      if (!useAuthStore.getState().isAuthenticated) {
        toast.error(
          "We could not open your order yet. Please wait a moment and try again.",
        );
        return;
      }
      router.push(
        `/dashboard/orders/${encodeURIComponent(view.order._id)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }, [router, syncSessionAfterConfirm, view?.order._id]);

  const submitConfirm = useCallback(
    async (confirmed: boolean) => {
      if (!activeToken) return;
      setSubmitting(true);
      try {
        const res = await guestOrderApi.submitConfirm(activeToken, confirmed);
        if (confirmed) {
          const sessionUser = (res.data as { user?: User } | undefined)?.user;
          if (sessionUser) {
            establishSession(sessionUser);
          }
          setView((prev) =>
            prev ?
              {
                ...prev,
                contact: {
                  ...prev.contact,
                  contactConfirmed: true,
                  emailVerified: true,
                  contactDeclined: false,
                },
              }
            : prev,
          );
          setDeclined(false);
          await syncSessionAfterConfirm();
          toast.success(guestVerificationCopy.toastConfirmYes);
          await loadView(activeToken);
        } else {
          setView((prev) =>
            prev ?
              {
                ...prev,
                contact: {
                  ...prev.contact,
                  contactDeclined: true,
                  contactConfirmed: false,
                },
              }
            : prev,
          );
          setDeclined(true);
          toast.success(guestVerificationCopy.toastConfirmNo);
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not save your response.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [activeToken, establishSession, loadView, syncSessionAfterConfirm],
  );

  if (loading || (activeToken && !view && !error)) {
    return (
      <div
        className={cn(
          "flex min-h-[50vh] flex-col items-center justify-center px-4 py-24",
          heritagePageBg,
        )}
      >
        <Loader2 className='h-10 w-10 animate-spin text-[#c5a059]' />
        <p className='mt-4 text-sm text-gray-600'>Loading your order…</p>
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className={cn("mx-auto max-w-lg px-4 py-16", heritagePageBg)}>
        <div className={cn(heritageSectionCard, "p-8 text-center")}>
          <p className='font-serif text-xl text-navy-900'>Link unavailable</p>
          <p className='mt-3 text-sm text-gray-600'>{error}</p>
          <Link
            href='/shop'
            className='mt-6 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900'
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const contactDeclined =
    declined || view.contact.contactDeclined === true;
  const alreadyDone = view.contact.contactConfirmed;
  const needsVerify = view.requiresContactVerification === true;
  const showIdentityConfirm =
    needsVerify && fromEmailLink && !alreadyDone && !contactDeclined;
  const awaitingEmailStep =
    needsVerify && !fromEmailLink && !alreadyDone && !contactDeclined;
  const registeredGuestSuccess = !needsVerify && !alreadyDone && !contactDeclined;

  const signInHref = loginUrlWithRedirect(
    `/dashboard/orders/${encodeURIComponent(view.order._id)}`,
  );

  const signupHref = buildGuestSignupPageHref({
    email: view.contact.email,
    redirectPath: `/dashboard/orders/${encodeURIComponent(view.order._id)}`,
  });

  const sentLabel =
    needsVerify ?
      view.confirmEmailSentAt ?
        guestVerificationCopy.emailSentAt(
          new Date(view.confirmEmailSentAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        )
      : guestVerificationCopy.emailNotSentYet
    : "Your order receipt and updates are being sent to your inbox.";

  return (
    <div className={cn("mx-auto max-w-xl px-4 py-12 sm:py-16", heritagePageBg)}>
      <div className={cn(heritageSectionCard, "p-6 sm:p-10")}>
        <div className='mb-6 flex items-center gap-3'>
          {registeredGuestSuccess ?
            <Check className='h-8 w-8 text-emerald-700' aria-hidden />
          : <ShieldCheck className='h-8 w-8 text-[#c5a059]' aria-hidden />}
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500'>
              {registeredGuestSuccess ?
                guestVerificationCopy.registeredGuestPageEyebrow
              : guestVerificationCopy.pageEyebrow}
            </p>
            <h1 className='font-serif text-2xl font-semibold text-navy-900'>
              {registeredGuestSuccess ?
                guestVerificationCopy.registeredGuestOrderTitle
              : view.order.orderNumber}
            </h1>
            {registeredGuestSuccess ?
              <p className='mt-1 text-sm font-medium text-navy-800'>
                {view.order.orderNumber}
              </p>
            : null}
          </div>
        </div>

        {registeredGuestSuccess ?
          <>
            <p className='text-sm leading-relaxed text-gray-600'>
              {guestVerificationCopy.registeredGuestOrderBody(view.contact.email)}
            </p>
            <p className='mt-4 text-sm leading-relaxed text-gray-600'>
              {guestVerificationCopy.registeredGuestSignInHint}
            </p>
            <Button asChild className='mt-5 w-full bg-navy-900 hover:bg-navy-800'>
              <Link href={signInHref}>
                <LogIn className='mr-2 h-4 w-4' aria-hidden />
                {guestVerificationCopy.registeredGuestSignInCta}
              </Link>
            </Button>
          </>
        : showIdentityConfirm ?
          <p className='text-sm leading-relaxed text-gray-600'>
            {guestVerificationCopy.emailLinkIntro(view.order.orderNumber)}
          </p>
        : awaitingEmailStep ?
          <p className='text-sm leading-relaxed text-gray-600'>
            {guestVerificationCopy.postCheckoutBody(view.contact.email)}
          </p>
        : <p className='text-sm leading-relaxed text-gray-600'>
            Order contact details for {view.order.orderNumber}.
          </p>
        }

        {!registeredGuestSuccess ?
          <p className='mt-3 text-xs text-gray-500'>{sentLabel}</p>
        : null}

        {awaitingEmailStep ?
          <GuestEmailVerificationPendingCard
            email={view.contact.email}
            activeStep={2}
            className='mt-5'
          />
        : null}

        {view.order.items && view.order.items.length > 0 ?
          <div className='mt-6 border border-gray-100 bg-white'>
            <p className='border-b border-gray-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500'>
              Your order
            </p>
            <ul className='divide-y divide-gray-50 px-4 py-1'>
              {view.order.items.map((line, idx) => (
                <li
                  key={`${line.name}-${idx}`}
                  className='flex justify-between gap-3 py-2.5 text-sm'
                >
                  <span className='text-navy-900'>
                    {line.name}
                    {line.variantLabel ?
                      <span className='text-gray-500'> · {line.variantLabel}</span>
                    : null}
                    <span className='text-gray-500'> × {line.quantity}</span>
                  </span>
                  <span className='shrink-0 font-medium text-navy-900'>
                    {formatPrice(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className='border-t border-gray-100 px-4 py-3 text-sm'>
              <div className='flex justify-between text-gray-600'>
                <span>Total</span>
                <span className='font-semibold text-navy-900'>
                  {formatPrice(view.order.total)}
                </span>
              </div>
            </div>
          </div>
        : null}

        {needsVerify && !alreadyDone && !editing ?
          <button
            type='button'
            onClick={() => setEditing(true)}
            className='mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5a059]'
          >
            <Pencil className='h-3.5 w-3.5' aria-hidden />
            Edit contact details
          </button>
        : null}

        {needsVerify && editing && !alreadyDone ?
          <div className='mt-4 space-y-3 border border-dashed border-gray-200 p-4'>
            <Input
              label='Name'
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label='Email'
              type='email'
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Input
              label='Mobile'
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                disabled={submitting}
                onClick={() => void saveContactEdits()}
              >
                Save & resend email
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        : <dl className='mt-6 space-y-2 border border-gray-100 bg-gray-50/80 p-4 text-sm'>
            <div className='flex justify-between gap-4'>
              <dt className='text-gray-500'>Name</dt>
              <dd className='font-medium text-navy-900'>
                {view.contact.name || view.order.shippingAddress?.name || "—"}
              </dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-gray-500'>Email</dt>
              <dd className='font-medium text-navy-900 break-all text-right'>
                {view.contact.email}
              </dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-gray-500'>Phone</dt>
              <dd className='font-medium text-navy-900'>
                {view.contact.phone || view.order.shippingAddress?.phone || "—"}
              </dd>
            </div>
            <div className='flex justify-between gap-4 border-t border-gray-200 pt-2'>
              <dt className='text-gray-500'>Total</dt>
              <dd className='font-semibold text-navy-900'>
                {formatPrice(view.order.total)}
              </dd>
            </div>
          </dl>
        }

        {registeredGuestSuccess ?
          <div className='mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6'>
            <Link
              href='/shop'
              className='text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-900 underline-offset-4 hover:underline'
            >
              Continue shopping
            </Link>
          </div>
        : alreadyDone ?
          <div className='mt-8 rounded border border-emerald-200 bg-emerald-50/80 p-5'>
            <div className='flex items-start gap-3'>
              <Check className='mt-0.5 h-6 w-6 shrink-0 text-emerald-700' />
              <div className='min-w-0 flex-1'>
                <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800'>
                  Verified
                </p>
                <p className='font-semibold text-emerald-950'>
                  {guestVerificationCopy.confirmedTitle}
                </p>
                <p className='mt-2 text-sm leading-relaxed text-emerald-900/90'>
                  {guestVerificationCopy.confirmedBody}
                </p>
              </div>
            </div>
            <div className='mt-5 flex flex-col gap-2 sm:flex-row'>
              <Button
                type='button'
                className='flex-1 bg-navy-900 hover:bg-navy-800'
                disabled={submitting}
                onClick={() => void goToOrderDetail()}
              >
                {submitting ?
                  <Loader2 className='h-4 w-4 animate-spin' />
                : guestVerificationCopy.viewOrderCta}
              </Button>
              <Button
                asChild
                variant='outline'
                className='flex-1 bg-white'
                disabled={submitting}
              >
                <Link href={signupHref}>
                  <KeyRound className='mr-2 h-4 w-4' />
                  {guestVerificationCopy.createPasswordCta}
                </Link>
              </Button>
            </div>
            {isAuthenticated ?
              <p className='mt-3 text-xs text-emerald-800'>
                You are signed in on this device. Create a password to use your
                account anywhere.
              </p>
            : null}
          </div>
        : contactDeclined ?
          <div className='mt-8 rounded border border-gray-200 bg-gray-50/90 p-5'>
            <div className='flex items-start gap-3'>
              <XCircle className='mt-0.5 h-6 w-6 shrink-0 text-gray-600' />
              <div>
                <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500'>
                  Recorded
                </p>
                <p className='font-semibold text-navy-900'>
                  {guestVerificationCopy.declinedTitle}
                </p>
                <p className='mt-2 text-sm leading-relaxed text-gray-600'>
                  {guestVerificationCopy.declinedBody}
                </p>
              </div>
            </div>
            <Link
              href='/shop'
              className='mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-900 underline-offset-4 hover:underline'
            >
              Continue shopping
            </Link>
          </div>
        : needsVerify && showIdentityConfirm ?
          <>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Button
                type='button'
                disabled={submitting || editing}
                className='flex-1 bg-navy-900 hover:bg-navy-800'
                onClick={() => void submitConfirm(true)}
              >
                {submitting ?
                  <Loader2 className='h-4 w-4 animate-spin' />
                : <>
                    <Check className='mr-2 h-4 w-4' />
                    {guestVerificationCopy.confirmYes}
                  </>
                }
              </Button>
              <Button
                type='button'
                variant='outline'
                disabled={submitting}
                className='flex-1'
                onClick={() => void submitConfirm(false)}
              >
                <X className='mr-2 h-4 w-4' />
                {guestVerificationCopy.confirmNo}
              </Button>
            </div>
            <div className='mt-6 border-t border-gray-100 pt-4'>
              <button
                type='button'
                onClick={() => void resendEmail()}
                className='flex w-full items-center justify-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600 hover:text-navy-900'
              >
                <Mail className='h-4 w-4' />
                {guestVerificationCopy.resendButton}
              </button>
            </div>
          </>
        : needsVerify && awaitingEmailStep ?
          <div className='mt-8 border-t border-gray-100 pt-6'>
            <button
              type='button'
              onClick={() => void resendEmail()}
              className='flex w-full items-center justify-center gap-2 border border-navy-900 bg-navy-900 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-800'
            >
              <Mail className='h-4 w-4' />
              {guestVerificationCopy.resendButton}
            </button>
            <p className='mt-3 text-center text-xs leading-relaxed text-gray-500'>
              {guestVerificationCopy.resendHint}
            </p>
          </div>
        : null}
      </div>
    </div>
  );
}

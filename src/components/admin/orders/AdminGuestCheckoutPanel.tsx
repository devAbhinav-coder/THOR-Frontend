"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

export type AdminGuestCheckoutMeta = {
  userId: string;
  isWebGuest: true;
  emailVerified: boolean;
  guestContactConfirmedAt?: string | null;
  guestContactConfirmedVia?: string | null;
  confirmEmailSentAt?: string | null;
  confirmEmailSendCount?: number;
  confirmUrl: string;
  whatsAppMessage: string;
  customerPhone?: string | null;
};

function buildCustomerWhatsAppHref(
  phone: string | null | undefined,
  text: string,
): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  let e164 = digits;
  if (digits.length === 10) e164 = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0"))
    e164 = `91${digits.slice(1)}`;
  else if (digits.length < 10) return null;
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}

type Props = {
  meta: AdminGuestCheckoutMeta;
  onUpdated: () => void | Promise<void>;
  className?: string;
};

export default function AdminGuestCheckoutPanel({
  meta,
  onUpdated,
  className,
}: Props) {
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<"link" | null>(null);

  const confirmed = Boolean(meta.guestContactConfirmedAt);
  const verifiedVia =
    meta.guestContactConfirmedVia === "customer" ? "Customer (link)"
    : meta.guestContactConfirmedVia === "admin" ? "Admin"
    : meta.emailVerified ? "Email flag only"
    : null;

  const resendEmail = useCallback(async () => {
    setResending(true);
    try {
      await adminApi.resendGuestConfirmEmail(meta.userId);
      toast.success("Confirmation email queued for the customer.");
      await onUpdated();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Could not resend confirmation email.",
      );
    } finally {
      setResending(false);
    }
  }, [meta.userId, onUpdated]);

  const markVerified = useCallback(async () => {
    if (
      !window.confirm(
        "Mark this guest's contact as verified? Use when the customer confirmed by phone or in store.",
      )
    ) {
      return;
    }
    setVerifying(true);
    try {
      await adminApi.verifyGuestContact(meta.userId);
      toast.success("Guest contact marked verified.");
      await onUpdated();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Could not verify contact.",
      );
    } finally {
      setVerifying(false);
    }
  }, [meta.userId, onUpdated]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meta.confirmUrl);
      setCopied("link");
      toast.success("Confirmation link copied.");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }, [meta.confirmUrl]);

  const openWhatsApp = useCallback(() => {
    const href = buildCustomerWhatsAppHref(
      meta.customerPhone,
      meta.whatsAppMessage,
    );
    if (!href) {
      toast.error("Add a valid customer phone on the profile or shipping address.");
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }, [meta.customerPhone, meta.whatsAppMessage]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-sm p-5 sm:p-6",
        className,
      )}
    >
      <h2 className='font-semibold text-gray-900 flex items-center gap-2 mb-4 border-b border-amber-200/60 pb-3'>
        <ShieldCheck className='h-4 w-4 text-amber-700' />
        Web guest checkout
      </h2>

      <div className='flex flex-wrap gap-2 mb-3'>
        <span className='inline-flex items-center rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950'>
          Guest (no full account)
        </span>
        {confirmed ?
          <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900'>
            <CheckCircle2 className='h-3 w-3' />
            Contact confirmed
          </span>
        : <span className='inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900'>
            <ShieldAlert className='h-3 w-3' />
            Awaiting confirmation
          </span>
        }
      </div>

      {verifiedVia ?
        <p className='text-xs text-gray-600 mb-2'>
          Verified via: <span className='font-medium'>{verifiedVia}</span>
          {meta.guestContactConfirmedAt ?
            ` · ${formatDateTime(meta.guestContactConfirmedAt)}`
          : null}
        </p>
      : null}

      <p className='text-xs text-gray-600 leading-relaxed'>
        {meta.confirmEmailSentAt ?
          `Last confirmation email queued: ${formatDateTime(meta.confirmEmailSentAt)} · sent ${meta.confirmEmailSendCount ?? 0} time(s).`
        : "No confirmation email logged yet for this guest."}
      </p>

      {!confirmed ?
        <div className='mt-4 space-y-2'>
          <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
            Customer order confirmation link
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='bg-white'
              onClick={() => void copyLink()}
            >
              {copied === "link" ?
                <CheckCircle2 className='h-3.5 w-3.5 mr-1.5 text-emerald-600' />
              : <Copy className='h-3.5 w-3.5 mr-1.5' />}
              Copy link
            </Button>
            <Button type='button' size='sm' variant='outline' className='bg-white' asChild>
              <a href={meta.confirmUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-3.5 w-3.5 mr-1.5' />
                Open page
              </a>
            </Button>
          </div>
        </div>
      : null}

      <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap'>
        <Button
          type='button'
          size='sm'
          variant='brand'
          disabled={resending}
          onClick={() => void resendEmail()}
        >
          {resending ?
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          : <>
              <Mail className='h-3.5 w-3.5 mr-1.5' />
              Resend confirmation email
            </>
          }
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='bg-white'
          disabled={verifying || confirmed}
          onClick={() => void markVerified()}
        >
          {verifying ?
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          : "Mark contact verified"}
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='bg-white'
          onClick={openWhatsApp}
        >
          <MessageCircle className='h-3.5 w-3.5 mr-1.5' />
          Open WhatsApp to customer
        </Button>
      </div>

      <Link
        href={`/admin/users?highlight=${encodeURIComponent(meta.userId)}`}
        className='mt-4 inline-block text-[11px] font-semibold text-brand-700 hover:underline'
      >
        View guest profile in Users
      </Link>
    </div>
  );
}

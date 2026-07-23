'use client';

import { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Mail,
  QrCode,
  X,
  Download,
  ExternalLink,
  Share2,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildBrandedQrDataUrl, downloadDataUrl, shareInvite } from '@/lib/brandedQr';

type InvitePayload = {
  invite: {
    url: string;
    qrDataUrl: string;
    expiresAt: string;
    emailSentAt?: string | null;
    productCount: number;
    reviewedCount: number;
  };
  order: {
    orderNumber: string;
    customerName: string;
    customerEmail: string | null;
  };
};

interface Props {
  orderId: string;
  className?: string;
}

export default function OrderReviewInvitePanel({ orderId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<InvitePayload | null>(null);
  const [brandedQr, setBrandedQr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await adminApi.createReviewInvite(orderId);
      const payload = res.data as InvitePayload;
      setData(payload);
      setBrandedQr(payload.invite.qrDataUrl);
      setOpen(true);

      try {
        const branded = await buildBrandedQrDataUrl(payload.invite.url, {
          title: 'The House of Rani',
          subtitle: `Order ${payload.order.orderNumber} · Share your experience`,
        });
        setBrandedQr(branded);
      } catch {
        setBrandedQr(payload.invite.qrDataUrl);
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Could not create invite');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!data?.invite.url) return;
    try {
      await navigator.clipboard.writeText(data.invite.url);
      setCopied(true);
      toast.success('Secure link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  const sendEmail = async () => {
    setEmailing(true);
    try {
      const res = await adminApi.emailReviewInvite(orderId);
      setData(res.data as InvitePayload);
      toast.success('Invite emailed to customer');
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Could not send email');
    } finally {
      setEmailing(false);
    }
  };

  const downloadQr = () => {
    const src = brandedQr || data?.invite.qrDataUrl;
    if (!src) return;
    downloadDataUrl(src, `HOR-review-QR-${data?.order.orderNumber || orderId}.png`);
    toast.success('QR downloaded');
  };

  const share = async () => {
    if (!data?.invite.url) return;
    setSharing(true);
    try {
      const mode = await shareInvite({
        url: data.invite.url,
        title: 'The House of Rani',
        text: `Hi${data.order.customerName ? ` ${data.order.customerName.split(' ')[0]}` : ''}! Please share your House of Rani experience for order ${data.order.orderNumber}:\n${data.invite.url}`,
        qrDataUrl: brandedQr || data.invite.qrDataUrl,
        filename: `HOR-review-QR-${data.order.orderNumber}.png`,
      });
      if (mode === 'native') toast.success('Shared');
      else if (mode === 'whatsapp') toast.success('Opened WhatsApp share');
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        toast.error('Could not share');
      }
    } finally {
      setSharing(false);
    }
  };

  const qrSrc = brandedQr || data?.invite.qrDataUrl;
  const isBrandedCard = Boolean(brandedQr && brandedQr !== data?.invite.qrDataUrl);

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60',
          className,
        )}
      >
        <QrCode className="h-4 w-4" />
        {loading ? 'Preparing…' : 'Review link / QR'}
      </button>

      {open && data ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#0b1220]/55 backdrop-blur-[3px]"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-invite-title"
            className="relative z-[1] w-full max-w-[400px] overflow-hidden rounded-2xl bg-[#fffdf8] shadow-[0_24px_80px_-20px_rgba(15,23,42,0.55)]"
          >
            {/* Brand header — compact */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#3d2a1c] px-4 py-3.5 text-white">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    'radial-gradient(ellipse at 20% 0%, rgba(197,160,89,0.35), transparent 55%)',
                }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e8d5a8]/90">
                    The House of Rani
                  </p>
                  <h2
                    id="review-invite-title"
                    className="mt-0.5 font-serif text-lg font-semibold leading-tight"
                  >
                    Review invite
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* No inner scroll — compact single view */}
            <div className="px-4 py-4 space-y-3.5">
              <p className="text-[12.5px] leading-snug text-gray-500">
                <span className="font-semibold text-[#0f172a]">{data.order.orderNumber}</span>
                {' · '}
                {data.invite.productCount} product
                {data.invite.productCount === 1 ? '' : 's'} · review + story
              </p>

              {/* Branded QR */}
              <div className="flex justify-center">
                {!qrSrc ? (
                  <div className="flex h-44 w-36 items-center justify-center rounded-xl border border-[#e8e0d4] bg-[#f7f4ef]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
                  </div>
                ) : isBrandedCard ? (
                  <div className="w-[168px] overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-md ring-1 ring-[#c5a059]/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrSrc}
                      alt="The House of Rani review QR"
                      className="block w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#3d2a1c] p-[2px] shadow-md">
                    <div className="flex flex-col items-center rounded-[10px] bg-[#fffdf8] px-4 py-4">
                      <p className="font-serif text-sm font-semibold text-[#0f172a]">
                        The House of Rani
                      </p>
                      <div className="mt-1.5 mb-3 h-px w-10 bg-[#c5a059]" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc}
                        alt="The House of Rani review QR"
                        className="h-[140px] w-[140px] rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* URL */}
              <div className="rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Secure URL
                  </p>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3d2a1c] hover:text-brand-700"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] font-mono leading-snug text-[#1a2744] truncate select-all">
                  {data.invite.url}
                </p>
              </div>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#c5a059]" />
                  Exp {new Date(data.invite.expiresAt).toLocaleDateString('en-IN')}
                </span>
                <span>·</span>
                <span>
                  Reviewed {data.invite.reviewedCount}/{data.invite.productCount}
                </span>
              </p>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="brand"
                  className="rounded-xl h-10"
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 border-[#e8e0d4] bg-white hover:bg-[#f7f4ef]"
                  loading={sharing}
                  onClick={share}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 border-[#e8e0d4] bg-white hover:bg-[#f7f4ef]"
                  onClick={downloadQr}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> QR PNG
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 border-[#e8e0d4] bg-white hover:bg-[#f7f4ef]"
                  loading={emailing}
                  disabled={!data.order.customerEmail}
                  onClick={sendEmail}
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  {data.order.customerEmail ? 'Email' : 'No email'}
                </Button>
              </div>

              <a
                href={data.invite.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] text-sm font-semibold text-white transition hover:bg-[#1a2744]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open form
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Mail,
  QrCode,
  X,
  Download,
  ExternalLink,
  Share2,
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

  const generate = async () => {
    setLoading(true);
    try {
      const res = await adminApi.createReviewInvite(orderId);
      const payload = res.data as InvitePayload;
      setData(payload);
      try {
        const branded = await buildBrandedQrDataUrl(payload.invite.url, {
          title: 'The House of Rani',
          subtitle: `Order ${payload.order.orderNumber} · Share your experience`,
        });
        setBrandedQr(branded);
      } catch {
        setBrandedQr(payload.invite.qrDataUrl);
      }
      setOpen(true);
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
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[1] w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-navy-900 to-brand-700 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">
                  Secure invite
                </p>
                <h2 className="font-serif text-lg font-bold">Review + story</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Private link for order <b>{data.order.orderNumber}</b> (
                {data.invite.productCount} product
                {data.invite.productCount === 1 ? '' : 's'}). Customer only sees items from this
                purchase. Submits as <b>product review + homepage story</b>.
              </p>

              <div className="flex justify-center rounded-2xl bg-[#f7f4ef] p-4 border border-[#e8e0d4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandedQr || data.invite.qrDataUrl}
                  alt="The House of Rani review QR"
                  className="w-full max-w-[340px] h-auto rounded-xl shadow-md"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Secure URL
                </p>
                <p className="text-xs font-mono text-navy-900 break-all">{data.invite.url}</p>
              </div>

              <p className="text-[11px] text-gray-400">
                Expires {new Date(data.invite.expiresAt).toLocaleDateString('en-IN')} · Reviewed{' '}
                {data.invite.reviewedCount}/{data.invite.productCount}
                {data.invite.emailSentAt
                  ? ` · Last emailed ${new Date(data.invite.emailSentAt).toLocaleString('en-IN')}`
                  : ''}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="brand" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button type="button" variant="outline" loading={sharing} onClick={share}>
                  <Share2 className="h-4 w-4 mr-1.5" /> Share
                </Button>
                <Button type="button" variant="outline" onClick={downloadQr}>
                  <Download className="h-4 w-4 mr-1.5" /> Download QR
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  loading={emailing}
                  disabled={!data.order.customerEmail}
                  onClick={sendEmail}
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  {data.order.customerEmail ? 'Email customer' : 'No email'}
                </Button>
                <a
                  href={data.invite.url}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" /> Open form
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

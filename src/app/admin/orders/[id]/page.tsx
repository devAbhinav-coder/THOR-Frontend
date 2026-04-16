'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  User as UserIcon,
  CreditCard,
  Clock,
  ExternalLink,
  FileText,
  Gift,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Circle,
  Compass,
  XCircle,
  RotateCcw,
  Undo2,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { Order, OrderItem, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatPrice, getOrderStatusColor, cn, getPaymentStatusColor } from '@/lib/utils';
import { getMaxRefundableInr, getNonRefundableFeesInr } from '@/lib/orderRefundPolicy';

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

function loyaltyTierBadge(segment: string | null) {
  if (!segment) return null;
  const tiers: Record<string, { label: string; className: string }> = {
    frequent_buyer: { label: 'VIP', className: 'bg-amber-100 text-amber-950 border-amber-200' },
    repeat_buyer: { label: 'Returning', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    new_buyer: { label: 'Member', className: 'bg-emerald-50 text-emerald-900 border-emerald-100' },
    prospect: { label: 'New', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const t = tiers[segment] ?? {
    label: segment.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        t.className,
      )}
      title="Based on paid orders and lifetime spend"
    >
      <Award className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      {t.label}
    </span>
  );
}

function getAutoTrackingUrl(carrier?: string, trackingNumber?: string) {
  const awb = trackingNumber?.trim();
  if (!awb) return null;
  const c = (carrier || '').toLowerCase().trim();

  if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
  if (c.includes('bluedart') || c.includes('blue dart'))
    return `https://www.bluedart.com/tracking?wbnum=${encodeURIComponent(awb)}`;
  if (c.includes('fedex') || c.includes('fed ex'))
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`;
  if (c.includes('dhl'))
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}`;
  if (c.includes('ecom') || c.includes('ecom express'))
    return `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`;
  if (c.includes('india post') || c.includes('indiapost') || c.includes('speed post'))
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?trackingid=${encodeURIComponent(awb)}`;

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || 'courier'} tracking ${awb}`)}`;
}

// Collapsible Custom Gift Details
function CustomGiftAccordion({ order }: { order: any }) {
  const [open, setOpen] = useState(true);
  const req = order.customRequestId;
  if (!req && order.productType !== 'custom') return null;

  return (
    <div className="bg-gradient-to-br from-gold-50 to-amber-50/50 rounded-2xl border border-gold-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold-100 flex items-center justify-center">
            <Gift className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Bespoke Custom Gift</p>
            <p className="text-xs text-gold-700">Customer-submitted specifications</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gold-100 p-5 space-y-4">
          {/* Link to request */}
          {order.customRequestId && (
            <a
              href={`/admin/gifting?req=${encodeURIComponent(order.customRequestId)}&tab=requests`}
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white px-3 py-1.5 rounded-lg border border-brand-100"
            >
              <Sparkles className="h-3 w-3" /> View Original Request <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Items with custom field answers */}
          <div className="space-y-3">
            {(order.items ?? []).map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-gold-100 p-3 space-y-2">
                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                {(item.customFieldAnswers?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {(item.customFieldAnswers ?? []).map((a: any, j: number) => (
                      <div key={j} className="bg-gold-50 rounded-lg px-2.5 py-1.5 border border-gold-100">
                        <p className="text-[10px] text-gold-600 font-bold">{a.label}</p>
                        {typeof a.value === "string" && /^https?:\/\//.test(a.value) ? (
                          <a href={a.value} target="_blank" rel="noreferrer" className="block mt-1">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden border border-gold-200 bg-white">
                              <Image src={a.value} alt={a.label} fill sizes="64px" className="object-cover" />
                            </div>
                            <span className="text-[10px] font-semibold text-brand-600 mt-1 block">Open full image</span>
                          </a>
                        ) : (
                          <p className="text-xs font-semibold text-gray-900 mt-0.5">{a.value || '—'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const [tracking, setTracking] = useState({
    shippingCarrier: '',
    trackingNumber: '',
    trackingUrl: '',
    note: '',
  });
  const [trackingErrors, setTrackingErrors] = useState<{ shippingCarrier?: string; trackingNumber?: string; trackingUrl?: string }>({});
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundNotes, setRefundNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'razorpay_auto' | 'cash' | 'bank_transfer' | 'upi_manual'>('razorpay_auto');
  const [refunding, setRefunding] = useState(false);
  const [resolvingReturn, setResolvingReturn] = useState(false);
  const [returnAdminNote, setReturnAdminNote] = useState('');
  const [loyaltySegment, setLoyaltySegment] = useState<string | null>(null);

  const trackingHref = useMemo(() => {
    if (!order) return null;
    return order.trackingUrl || getAutoTrackingUrl(order.shippingCarrier, order.trackingNumber);
  }, [order]);

  const refundPolicy = useMemo(() => {
    if (!order) return null;
    return {
      nonRefundable: getNonRefundableFeesInr(order),
      maxRefundable: getMaxRefundableInr(order),
    };
  }, [order]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getOrderDetails(id);
        const o: Order = res.data.order;
        setOrder(o);
        setTracking({
          shippingCarrier: o.shippingCarrier || '',
          trackingNumber: o.trackingNumber || '',
          trackingUrl: o.trackingUrl || '',
          note: '',
        });
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [id]);

  useEffect(() => {
    if (!order) {
      setLoyaltySegment(null);
      return;
    }
    const uid =
      typeof order.user === 'object' && order.user && '_id' in order.user
        ? String((order.user as { _id: string })._id)
        : typeof order.user === 'string'
          ? order.user
          : null;
    if (!uid) {
      setLoyaltySegment(null);
      return;
    }
    let cancelled = false;
    adminApi
      .getUserInsights(uid)
      .then((res) => {
        if (!cancelled) setLoyaltySegment(res.data.metrics.userSegment);
      })
      .catch(() => {
        if (!cancelled) setLoyaltySegment(null);
      });
    return () => {
      cancelled = true;
    };
  }, [order]);

  const updateStatus = async (status: OrderStatus) => {
    if (status === 'shipped') {
      setTrackingModalOpen(true);
      return;
    }
    if (!order) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(order._id, { status });
      toast.success(`Status updated to ${status}`);
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const processRefundAction = async () => {
    if (!order) return;
    setRefunding(true);
    try {
      const refundAmount = refundPolicy?.maxRefundable ?? order.total;
      if (refundAmount <= 0) {
        toast.error('Nothing eligible to refund (non-refundable fees may equal order total).');
        return;
      }
      await adminApi.processRefund(order._id, {
        amount: refundAmount,
        refundMethod: order.paymentMethod === 'razorpay' ? 'razorpay_auto' : refundMethod,
        notes: refundNotes,
      });
      toast.success('Refund processed successfully');
      setRefundModalOpen(false);
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  const resolveReturnAction = async (action: 'approve' | 'reject') => {
    if (!order) return;
    if (!confirm(`Are you sure you want to ${action} this return?`)) return;
    setResolvingReturn(true);
    try {
      await adminApi.resolveReturn(order._id, { action, adminNote: returnAdminNote || undefined });
      toast.success(`Return ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
      setReturnAdminNote('');
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to resolve return');
    } finally {
      setResolvingReturn(false);
    }
  };

  const markShippedWithTracking = async () => {
    if (!order) return;
    const errs: typeof trackingErrors = {};
    if (!tracking.shippingCarrier.trim()) errs.shippingCarrier = 'Courier is required';
    if (!tracking.trackingNumber.trim()) errs.trackingNumber = 'Tracking/AWB is required';
    if (tracking.trackingUrl.trim() && !/^https?:\/\//i.test(tracking.trackingUrl.trim())) {
      errs.trackingUrl = 'Tracking URL must start with http(s)://';
    }
    setTrackingErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(order._id, {
        status: 'shipped',
        note: tracking.note || undefined,
        shippingCarrier: tracking.shippingCarrier || undefined,
        trackingNumber: tracking.trackingNumber || undefined,
        trackingUrl: tracking.trackingUrl || undefined,
      });
      toast.success('Marked as shipped');
      const res = await adminApi.getOrderDetails(order._id);
      setOrder(res.data.order);
      setTrackingModalOpen(false);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 xl:p-8 space-y-4 animate-pulse">
        <div className="h-7 w-48 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-56 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 xl:p-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-700 font-semibold">Order not found</p>
          <Button asChild variant="brand" className="mt-4">
            <Link href="/admin/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const user =
    typeof order.user === 'object'
      ? (order.user as { name?: string; email?: string; phone?: string; avatar?: string })
      : null;
  const orderItems = order.items ?? [];
  const invoiceEligible = order.paymentStatus === 'paid' || order.status === 'delivered';

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/orders')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Order:</span>
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full capitalize', getOrderStatusColor(order.status))}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Payment:</span>
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full capitalize', getPaymentStatusColor(order.paymentStatus))}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Order</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">{order.orderNumber}</h1>
              {order.productType === 'custom' && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700 border border-gold-200 flex items-center gap-1">
                  <Gift className="h-2.5 w-2.5" /> Bespoke Gift
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={!invoiceEligible || generatingInvoice}
              onClick={async () => {
                if (!invoiceEligible) return;
                setGeneratingInvoice(true);
                try {
                  await adminApi.generateOrderInvoice(order._id);
                  toast.success('Invoice generated');
                  const refreshed = await adminApi.getOrderDetails(order._id);
                  setOrder(refreshed.data.order as Order);
                } catch (err: unknown) {
                  toast.error((err as { message?: string })?.message || 'Failed to generate invoice');
                } finally {
                  setGeneratingInvoice(false);
                }
              }}
              className={cn(
                "px-3 py-2 rounded-xl border text-xs font-semibold",
                invoiceEligible ? "border-brand-200 text-brand-700 hover:bg-brand-50" : "border-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {generatingInvoice ? 'Generating…' : order.invoice?.isGenerated ? 'Regenerate Invoice' : 'Generate Invoice'}
            </button>
            {order.invoice?.isGenerated && (
              <Link
                href={`/admin/orders/${encodeURIComponent(order._id)}/invoice`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-900 to-navy-800 text-xs font-semibold text-white shadow-sm transition-all hover:from-navy-800 hover:to-navy-700 hover:shadow-md"
              >
                <FileText className="h-3.5 w-3.5" />
                View Invoice
              </Link>
            )}
            <select
  onChange={(e) => updateStatus(e.target.value as OrderStatus)}
  className="px-3 py-2 rounded-xl border text-sm"
>
  <option value="">Update Status</option>
  {ORDER_STATUSES.map((s) => (
    <option key={s} value={s}>
      {s}
    </option>
  ))}
</select>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          {(() => {
            const o = order;
            if (!o) return null;

            return (
              <>
                {/* Return / Refund Context */}
                {((o as any).returnStatus && (o as any).returnStatus !== 'none') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <h3 className="text-amber-800 font-bold flex items-center gap-2 text-sm">
                          <Circle className="h-2 w-2 text-amber-500 fill-amber-500" />
                          Return Status: <span className="capitalize">{(o as any).returnStatus}</span>
                        </h3>
                        {(o as any).returnRequest?.reason && (
                          <p className="text-amber-700 text-sm mt-1">
                            <span className="font-semibold">Reason:</span> {(o as any).returnRequest.reason}
                            {(o as any).returnRequest?.note ? ` — ${(o as any).returnRequest.note}` : ''}
                          </p>
                        )}
                        {(o as any).returnRequest?.refundMethod && (
                          <p className="text-amber-700 text-sm mt-1">
                            <span className="font-semibold">Refund Method Requested:</span>{' '}
                            <span className="capitalize bg-amber-100 px-2 py-0.5 rounded-lg text-xs font-bold">{(o as any).returnRequest.refundMethod.replace(/_/g, ' ')}</span>
                          </p>
                        )}
                      </div>
                      {o.status !== 'refunded' && (o as any).returnStatus === 'approved' && (
                        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setRefundModalOpen(true)}>
                          Process Refund
                        </Button>
                      )}
                    </div>

                    {/* Bank Details if COD */}
                    {(o as any).returnRequest?.userBankDetails && (
                      <div className="bg-white/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Customer Refund Details</p>
                        {(o as any).returnRequest.refundMethod === 'upi' ? (
                          <p className="text-sm text-gray-800"><span className="font-semibold text-gray-600">UPI ID:</span> {(o as any).returnRequest.userBankDetails.upiId}</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {[
                              ['Account Name', (o as any).returnRequest.userBankDetails.accountName],
                              ['Account Number', (o as any).returnRequest.userBankDetails.accountNumber],
                              ['IFSC Code', (o as any).returnRequest.userBankDetails.ifscCode],
                              ['Bank Name', (o as any).returnRequest.userBankDetails.bankName],
                            ].filter(([,v]) => v).map(([label, value]) => (
                              <div key={label as string}>
                                <span className="text-gray-500 text-xs">{label as string}</span>
                                <p className="font-semibold text-gray-900 font-mono text-sm">{value as string}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approve / Reject if still requested */}
                    {(o as any).returnStatus === 'requested' && (
                      <div className="space-y-2">
                        <textarea
                          value={returnAdminNote}
                          onChange={e => setReturnAdminNote(e.target.value)}
                          placeholder="Note to customer (optional)"
                          rows={2}
                          className="w-full px-3 py-2 border border-amber-200 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            loading={resolvingReturn}
                            onClick={() => resolveReturnAction('approve')}
                          >
                            ✅ Approve Return
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                            loading={resolvingReturn}
                            onClick={() => resolveReturnAction('reject')}
                          >
                            ❌ Reject Return
                          </Button>
                        </div>
                      </div>
                    )}

                    {(o as any).refundData && (
                      <div className="mt-2 pt-3 border-t border-amber-200/60 text-sm text-amber-800 space-y-1">
                        <div className="flex justify-between gap-2">
                          <span><span className="font-semibold">Refunded:</span> {formatPrice((o as any).refundData.amount)}</span>
                          <span><span className="font-semibold">Via:</span>{' '}
                            <span className="capitalize">{String((o as any).refundData.method).replace(/_/g, ' ')}</span>
                          </span>
                        </div>
                        {(o as any).refundData.nonRefundableFees > 0 && (
                          <p className="text-xs text-amber-700/90">
                            Non-refundable fees retained:{' '}
                            <span className="font-semibold tabular-nums">
                              {formatPrice((o as any).refundData.nonRefundableFees)}
                            </span>{' '}
                            (shipping / COD)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4 text-brand-600" /> Items ({o.items?.length || 0})
                  </h2>
                  <div className="space-y-4">
                    {(o.items || []).map((it, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="relative h-16 w-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          {it.image ?
                            <Image src={it.image} alt={it.name || 'Product'} fill sizes="56px" className="object-cover" />
                          : <div className="h-full w-full bg-gray-100" aria-hidden />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{it.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[it.variant?.size, it.variant?.color, it.variant?.sku].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Qty {it.quantity} · {formatPrice(it.price)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {formatPrice(it.price * it.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {o.productType === 'custom' && <CustomGiftAccordion order={o} />}
              </>
            );
          })()}

          {/* Horizontal Status Timeline - MOVED BELOW ITEMS */}
          {(() => {
            const o = order; // Local ref for null-safety
            if (!o) return null;

            return (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full border border-blue-600 flex items-center justify-center">
                     <Compass className="h-3 w-3 text-blue-600" />
                  </div>
                  <h2 className="font-bold text-gray-900">Order Lifecycle</h2>
                </div>

                <div className="w-full overflow-x-auto pb-4">
                  <div className="flex items-start min-w-[700px] relative mt-6 font-sans">
                    
                    {(() => {
                      const standardFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                      const flow = [...standardFlow];
                      
                      // Check for post-delivery states
                      const history = o.statusHistory || [];
                      const hasHistory = (s: string) => history.some(h => h.status === s);

                      const returnRequested = hasHistory('return_requested');
                      const returnApproved = hasHistory('return_approved');
                      const returnRejected = hasHistory('return_rejected');
                      const isRefunded = o.status === 'refunded' || hasHistory('refunded');
                      const isCancelled = o.status === 'cancelled';

                      if (returnRequested) flow.push('return_requested');
                      if (returnApproved) flow.push('return_approved');
                      if (returnRejected) flow.push('return_rejected');
                      if (isRefunded) flow.push('refunded');
                      if (isCancelled && !returnRequested) {
                        // Logic for pre-delivery cancellation
                        const lastStatus = history
                          .filter(h => standardFlow.includes(h.status))
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.status;
                        
                        const lastIndex = standardFlow.indexOf(lastStatus || 'pending');
                        const truncatedFlow = standardFlow.slice(0, lastIndex + 1);
                        truncatedFlow.push('cancelled');
                        return renderFlow(truncatedFlow, true);
                      }

                      function renderFlow(activeFlow: string[], preDeliveryFailure = false) {
                        const currentIndex = activeFlow.indexOf(o!.status);
                        
                        return activeFlow.map((step, index) => {
                          const isCompleted = activeFlow.indexOf(o!.status) >= index;
                          const historyItem = history.find(h => h.status === step);
                          const timestamp = historyItem ? formatDateTime(historyItem.timestamp) : '';
                          
                          const isFailureStep = step === 'cancelled' || step === 'return_rejected';
                          const isWarningStep = step === 'return_requested' || step === 'refunded';
                          
                          let icon = null;
                          if (step === 'delivered' && isCompleted) {
                             icon = (
                               <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full z-10 border border-emerald-100/50 relative top-0.5">
                                 <CheckCircle2 className="h-4 w-4 text-white fill-emerald-600" />
                                 <span className="text-emerald-800 text-[13px] font-bold capitalize pt-px">{step.replace(/_/g, ' ')}</span>
                               </div>
                             );
                          } else if (isFailureStep && isCompleted) {
                             icon = (
                               <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full z-10 border border-red-100 relative top-0.5">
                                 <XCircle className="h-4 w-4 text-red-600 fill-red-600" />
                                 <span className="text-red-800 text-[13px] font-bold capitalize pt-px">{step.replace(/_/g, ' ')}</span>
                               </div>
                             );
                          } else if (isWarningStep && isCompleted) {
                            /* Static Tailwind classes — dynamic `bg-${color}-50` is purged and renders white */
                            icon =
                              step === 'refunded' ? (
                                <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full z-10 border border-orange-200 relative top-0.5 shadow-sm">
                                  <Undo2 className="h-4 w-4 text-orange-600 shrink-0" />
                                  <span className="text-orange-900 text-[13px] font-bold capitalize pt-px">
                                    {step.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full z-10 border border-amber-200 relative top-0.5 shadow-sm">
                                  <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span className="text-amber-900 text-[13px] font-bold capitalize pt-px">
                                    {step.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              );
                          } else if (step === 'shipped') {
                             icon = (
                               <div className="bg-white px-3 z-10">
                                 <Truck className={cn("h-6 w-6 mt-1", isCompleted ? "text-blue-600 fill-blue-600" : "text-gray-300")} />
                               </div>
                             );
                          } else if (isCompleted) {
                             icon = (
                               <div className="bg-white px-2 z-10">
                                 <CheckCircle2 className="h-6 w-6 text-white fill-emerald-600 rounded-full mt-1.5" />
                               </div>
                             );
                          } else {
                             icon = (
                               <div className="bg-white px-2 z-10">
                                 <Circle className="h-2 w-2 text-gray-300 fill-gray-300 mt-3" />
                               </div>
                             );
                          }

                          return (
                            <div key={step} className={cn("relative flex flex-col items-center", index === activeFlow.length - 1 ? "flex-[0.5]" : "flex-1")}>
                              {/* Connecting Line */}
                              {index < activeFlow.length - 1 && (
                                <div className={cn(
                                  "absolute top-5 left-[50%] right-[-50%] h-[2px] z-0",
                                  activeFlow.indexOf(o!.status) > index ? (preDeliveryFailure && index >= activeFlow.indexOf(o!.status) - 1 ? "bg-red-200" : "bg-emerald-600") : "bg-gray-200"
                                )} />
                              )}
                              
                              {/* Node Icon */}
                              <div className="relative z-10 flex justify-center h-10 items-center w-full">
                                {icon}
                              </div>
                              
                              {/* Node Label & Date */}
                              <div className={cn("mt-3 text-center", (step === 'delivered' && isCompleted) || (isFailureStep && isCompleted) || (isWarningStep && isCompleted) ? "mt-2" : "mt-3")}>
                                {(!isCompleted || (step !== 'delivered' && !isFailureStep && !isWarningStep)) && (
                                  <p className={cn("text-[14px] font-bold capitalize", isCompleted ? "text-gray-900" : "text-gray-500")}>
                                    {step.replace(/_/g, ' ')}
                                  </p>
                                )}
                                {timestamp && <p className={cn("text-[11px] text-gray-500", (step === 'delivered' && isCompleted) || (isFailureStep && isCompleted) || (isWarningStep && isCompleted) ? "mt-0" : "mt-1")}>{timestamp}</p>}
                              </div>
                            </div>
                          );
                        });
                      }

                      return renderFlow(flow);
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}


        </div>

        {/* Right: Customer + address + totals + tracking */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <UserIcon className="h-4 w-4 text-brand-600" /> Customer
            </h2>
            <div className="flex items-center gap-3 mb-1">
              {user?.avatar ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-gray-200">
                  <Image
                    src={user.avatar}
                    alt={user?.name || 'Customer'}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-100 to-navy-100 flex items-center justify-center text-sm font-black text-brand-700">
                  {String(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{user?.name || '—'}</p>
                {loyaltyTierBadge(loyaltySegment)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{user?.email || ''}</p>
            {user?.phone && <p className="text-xs text-gray-500 mt-1">{user.phone}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-brand-600" /> Shipping
            </h2>
            <p className="text-sm font-semibold text-gray-900">
              {order.shippingAddress?.name || '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {order.shippingAddress?.phone || ''}
            </p>
            <p className="text-sm text-gray-700 mt-3">
              {order.shippingAddress.house && (
                <>
                  {order.shippingAddress.house}
                  <br />
                </>
              )}
              {order.shippingAddress.street}
              {order.shippingAddress.landmark && (
                <>
                  <br />
                  <span className="text-gray-500">
                    Landmark: {order.shippingAddress.landmark}
                  </span>
                </>
              )}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
              {order.shippingAddress.pincode}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-brand-600" /> Totals
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 gap-2">
                <span className="min-w-0">
                  Shipping
                  <span className="block text-[10px] font-normal text-amber-700/90 mt-0.5">
                    Non-refundable on returns
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-right">
                  {order.shippingCharge === 0 ?
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  : formatPrice(order.shippingCharge || 0)}
                </span>
              </div>
              {(order.codFee || 0) > 0 && (
                <div className="flex justify-between text-gray-600 gap-2">
                  <span className="min-w-0">
                    COD handling fee
                    <span className="block text-[10px] font-normal text-amber-700/90 mt-0.5">
                      COD only — non-refundable on returns
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(order.codFee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {refundPolicy && refundPolicy.nonRefundable > 0 && (
                <div className="rounded-xl bg-amber-50/80 border border-amber-100 px-3 py-2 text-[11px] text-amber-900 leading-snug">
                  <span className="font-semibold">Return refunds:</span> max{' '}
                  <span className="tabular-nums font-bold">{formatPrice(refundPolicy.maxRefundable)}</span> to
                  customer (shipping {formatPrice(order.shippingCharge || 0)}
                  {(order.codFee || 0) > 0 ? ` + COD ${formatPrice(order.codFee || 0)}` : ''} retained).
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" /> Tracking Details
              </h2>
              {order.status === 'shipped' && (
                <button 
                  onClick={() => setTrackingModalOpen(true)}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider bg-brand-50 px-2 py-1 rounded-lg"
                >
                  Edit Options
                </button>
              )}
            </div>

            <div className="p-5 sm:p-6">
              {order.trackingNumber ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Carrier</p>
                      <p className="text-sm font-bold text-gray-900">{order.shippingCarrier || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AWB Number</p>
                      <p className="text-sm font-bold text-gray-900 font-mono tracking-tight">{order.trackingNumber}</p>
                    </div>
                  </div>

                  {trackingHref && (
                    <a
                      href={trackingHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-3 rounded-xl border border-brand-100 bg-brand-50/50 hover:bg-brand-50 text-sm font-bold text-brand-700 transition-colors"
                    >
                      Track Package <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  )}

                  {order.status !== 'shipped' && order.status !== 'delivered' && (
                    <p className="text-xs text-gray-400 text-center italic">
                      Tracking info is visible to the customer.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No tracking attached yet</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
                    Mark as "Shipped" from the status menu to add tracking details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="absolute inset-0" onClick={() => setTrackingModalOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Shipping</p>
              <h3 className="text-lg font-bold text-gray-900">Add tracking details</h3>
              <p className="text-xs text-gray-500 mt-1">
                Required — users will see this in their tracking emails and order details.
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Courier</label>
                <input
                  value={tracking.shippingCarrier}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, shippingCarrier: undefined })); setTracking((p) => ({ ...p, shippingCarrier: e.target.value })); }}
                  placeholder="e.g. Delhivery, BlueDart, FedEx"
                  className={cn("w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300", trackingErrors.shippingCarrier ? "border-red-300 bg-red-50/40" : "border-gray-200")}
                />
                {trackingErrors.shippingCarrier && <p className="text-xs text-red-600 mt-1">{trackingErrors.shippingCarrier}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tracking / AWB number</label>
                <input
                  value={tracking.trackingNumber}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingNumber: undefined })); setTracking((p) => ({ ...p, trackingNumber: e.target.value })); }}
                  placeholder="e.g. 1234567890"
                  className={cn("w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300", trackingErrors.trackingNumber ? "border-red-300 bg-red-50/40" : "border-gray-200")}
                />
                {trackingErrors.trackingNumber && <p className="text-xs text-red-600 mt-1">{trackingErrors.trackingNumber}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tracking URL (optional)</label>
                <input
                  value={tracking.trackingUrl}
                  onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingUrl: undefined })); setTracking((p) => ({ ...p, trackingUrl: e.target.value })); }}
                  placeholder="https://..."
                  className={cn("w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300", trackingErrors.trackingUrl ? "border-red-300 bg-red-50/40" : "border-gray-200")}
                />
                {trackingErrors.trackingUrl && <p className="text-xs text-red-600 mt-1">{trackingErrors.trackingUrl}</p>}
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTrackingModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" className="flex-1 rounded-xl" loading={updating} onClick={markShippedWithTracking}>
                Mark Shipped
              </Button>
            </div>
          </div>
        </div>
      )}

      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="bg-white w-full sm:w-[480px] rounded-t-2xl sm:rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Process Refund</h2>
            <p className="text-sm text-gray-600 mb-3">
              Eligible refund:{' '}
              <span className="font-bold text-gray-900 tabular-nums">
                {formatPrice(refundPolicy?.maxRefundable ?? order.total)}
              </span>{' '}
              (order total minus non-refundable shipping &amp; COD fees).
            </p>
            {refundPolicy && refundPolicy.nonRefundable > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                Retained: shipping {formatPrice(order.shippingCharge || 0)}
                {(order.codFee || 0) > 0 ? ` · COD ${formatPrice(order.codFee || 0)}` : ''}.
              </p>
            )}
            <div className="space-y-4">
              {order.paymentMethod === 'razorpay' ? (
                <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl">
                  This order was paid via Razorpay. It will be securely refunded directly to the original payment source.
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Select Offline Refund Method (COD Order)</label>
                  <select 
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    <option value="cash">Cash (Manual)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi_manual">UPI (Manual)</option>
                  </select>
                </div>
              )}
              <input
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason / Note for Audit Log"
                className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" disabled={refunding} onClick={() => setRefundModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="brand" className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 border-red-600 text-white" loading={refunding} onClick={processRefundAction}>
                  Confirm Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


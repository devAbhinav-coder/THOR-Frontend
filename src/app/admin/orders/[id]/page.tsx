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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { Order, OrderItem, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatPrice, getOrderStatusColor, cn, getPaymentStatusColor } from '@/lib/utils';

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

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

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [tracking, setTracking] = useState({
    shippingCarrier: '',
    trackingNumber: '',
    trackingUrl: '',
    note: '',
  });
  const [trackingErrors, setTrackingErrors] = useState<{ shippingCarrier?: string; trackingNumber?: string; trackingUrl?: string }>({});
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  const trackingHref = useMemo(() => {
    if (!order) return null;
    return order.trackingUrl || getAutoTrackingUrl(order.shippingCarrier, order.trackingNumber);
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
    typeof order.user === 'object' ? (order.user as { name?: string; email?: string; phone?: string }) : null;

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
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full capitalize', getOrderStatusColor(order.status))}>
            {order.status}
          </span>
          <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full capitalize', getPaymentStatusColor(order.paymentStatus))}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Order</p>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating}
                onClick={() => updateStatus(s)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Mark {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-brand-600" /> Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((it: OrderItem, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="relative h-16 w-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <Image src={it.image} alt={it.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{it.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[it.variant.size, it.variant.color, it.variant.sku].filter(Boolean).join(' · ')}
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

          {/* Status history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-brand-600" /> Status History
            </h2>
            <div className="space-y-3">
              {(order.statusHistory || []).slice().reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-600 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 capitalize">{h.status}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(h.timestamp)}</p>
                    {h.note && <p className="text-xs text-gray-400 mt-1">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Customer + address + totals + tracking */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <UserIcon className="h-4 w-4 text-brand-600" /> Customer
            </h2>
            <p className="text-sm font-semibold text-gray-900">{user?.name || '—'}</p>
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
              {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
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
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCharge || 0)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-brand-600" /> Tracking
            </h2>

            <div className="space-y-3">
              <input
                value={tracking.shippingCarrier}
                onChange={(e) => { setTrackingErrors((p) => ({ ...p, shippingCarrier: undefined })); setTracking((p) => ({ ...p, shippingCarrier: e.target.value })); }}
                placeholder="Courier (Delhivery/BlueDart/FedEx...)"
                className={cn(
                  "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                  trackingErrors.shippingCarrier ? "border-red-300 bg-red-50/40" : "border-gray-200"
                )}
              />
              {trackingErrors.shippingCarrier && <p className="text-xs text-red-600">{trackingErrors.shippingCarrier}</p>}
              <input
                value={tracking.trackingNumber}
                onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingNumber: undefined })); setTracking((p) => ({ ...p, trackingNumber: e.target.value })); }}
                placeholder="Tracking / AWB"
                className={cn(
                  "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                  trackingErrors.trackingNumber ? "border-red-300 bg-red-50/40" : "border-gray-200"
                )}
              />
              {trackingErrors.trackingNumber && <p className="text-xs text-red-600">{trackingErrors.trackingNumber}</p>}
              <input
                value={tracking.trackingUrl}
                onChange={(e) => { setTrackingErrors((p) => ({ ...p, trackingUrl: undefined })); setTracking((p) => ({ ...p, trackingUrl: e.target.value })); }}
                placeholder="Tracking URL (optional)"
                className={cn(
                  "w-full h-11 px-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300",
                  trackingErrors.trackingUrl ? "border-red-300 bg-red-50/40" : "border-gray-200"
                )}
              />
              {trackingErrors.trackingUrl && <p className="text-xs text-red-600">{trackingErrors.trackingUrl}</p>}
              <input
                value={tracking.note}
                onChange={(e) => setTracking((p) => ({ ...p, note: e.target.value }))}
                placeholder="Note (optional)"
                className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />

              <div className="flex gap-3">
                <Button
                  variant="brand"
                  className="flex-1 rounded-xl"
                  loading={updating}
                  onClick={markShippedWithTracking}
                >
                  Save & Mark Shipped
                </Button>
                {trackingHref && (
                  <a
                    href={trackingHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700"
                  >
                    Track <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                )}
              </div>
              {order.status !== 'shipped' && (
                <p className="text-xs text-gray-400">
                  Tip: Tracking details are shown to the customer after you mark the order as shipped.
                </p>
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
    </div>
  );
}


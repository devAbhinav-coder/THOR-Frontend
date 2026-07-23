'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Trash2, Star, Check, X, Copy, Download, Search, Package, QrCode, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, testimonialApi } from '@/lib/api';
import type { Testimonial } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSiteUrl } from '@/lib/siteUrl';
import { cn } from '@/lib/utils';
import { buildBrandedQrDataUrl, downloadDataUrl, shareInvite } from '@/lib/brandedQr';

type ProductHit = {
  _id: string;
  name: string;
  slug?: string;
  images?: { url: string }[];
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductHit | null>(null);
  const [searching, setSearching] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);

  const site = useMemo(() => getSiteUrl(), []);
  const storyUrl = `${site}/share-your-story`;
  const productReviewUrl = selectedProduct
    ? `${site}/share-your-story?productId=${encodeURIComponent(selectedProduct._id)}`
    : null;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await testimonialApi.getAdminAll();
      const list = res.data?.testimonials;
      setItems(Array.isArray(list) ? (list as Testimonial[]) : []);
    } catch {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (productQuery.trim().length < 1) {
      setProductHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      adminApi
        .searchProducts({
          q: productQuery.trim(),
          limit: 12,
          simple: 'true',
          isActive: true,
        })
        .then((res) => {
          setProductHits((res.data?.products || []) as ProductHit[]);
        })
        .catch(() => setProductHits([]))
        .finally(() => setSearching(false));
    }, 200);
    return () => window.clearTimeout(t);
  }, [productQuery]);

  const pendingCount = items.filter((t) => (t.status || 'pending') === 'pending').length;

  const visible = items.filter((t) => {
    const status = t.status || (t.isActive ? 'approved' : 'pending');
    if (filter === 'all') return true;
    return status === filter;
  });

  const copyText = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      toast.error('Could not copy');
    }
  };

  const makeQr = async (url: string, title: string, subtitle: string, filename: string) => {
    setQrBusy(true);
    try {
      const dataUrl = await buildBrandedQrDataUrl(url, { title, subtitle });
      setQrPreview(dataUrl);
      downloadDataUrl(dataUrl, filename);
      toast.success('QR downloaded');
      return dataUrl;
    } catch {
      toast.error('Could not generate QR');
      return null;
    } finally {
      setQrBusy(false);
    }
  };

  const shareLink = async (url: string, label: string, qrDataUrl?: string | null) => {
    try {
      const mode = await shareInvite({
        url,
        title: 'The House of Rani',
        text: `${label}\n${url}`,
        qrDataUrl: qrDataUrl || qrPreview,
        filename: 'HOR-share-QR.png',
      });
      if (mode === 'native') toast.success('Shared');
      else if (mode === 'whatsapp') toast.success('Opened WhatsApp');
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') toast.error('Could not share');
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await testimonialApi.approve(id);
      toast.success('Approved — live on homepage');
      fetchAll();
    } catch {
      toast.error('Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      await testimonialApi.reject(id);
      toast.success('Rejected');
      fetchAll();
    } catch {
      toast.error('Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this story permanently?')) return;
    try {
      await testimonialApi.delete(id);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Trust Builder</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Customer Stories</h1>
        <p className="mt-1 text-sm text-white/80">
          You decide the link. Customers only fill the form — no product picker / mode choice for them.
          Offline orders: use <b>Review link / QR</b> on the order page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Story-only */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Homepage story</p>
          <p className="text-sm text-gray-600">
            General link — customer shares a brand story only (no product review).
          </p>
          <code className="block text-xs bg-gray-50 rounded-lg px-3 py-2 break-all text-navy-900">
            {storyUrl}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => copyText(storyUrl, 'Story link copied')}
            >
              <Copy className="h-4 w-4 mr-1.5" /> Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => shareLink(storyUrl, 'Share your House of Rani story:')}
            >
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={qrBusy}
              onClick={() =>
                makeQr(
                  storyUrl,
                  'The House of Rani',
                  'Share your story',
                  'HOR-story-QR.png',
                )
              }
            >
              <Download className="h-4 w-4 mr-1.5" /> Download QR
            </Button>
          </div>
        </div>

        {/* Product-locked review + story */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Product review + story
          </p>
          <p className="text-sm text-gray-600">
            Admin picks the product. Customer only reviews that piece (+ homepage story).
          </p>

          {selectedProduct ? (
            <div className="flex items-center gap-3 rounded-xl border border-navy-900/10 bg-navy-50/40 px-3 py-2">
              {selectedProduct.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.images[0].url}
                  alt=""
                  className="h-11 w-11 rounded-lg object-cover"
                />
              ) : (
                <Package className="h-5 w-5 text-gray-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900 truncate">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                className="text-xs text-brand-700 font-medium"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductQuery('');
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search product…"
              />
              {(searching || productHits.length > 0) && (
                <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {searching && productHits.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">Searching…</p>
                  ) : null}
                  {productHits.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setSelectedProduct(p);
                        setProductHits([]);
                        setProductQuery('');
                      }}
                    >
                      {p.images?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : null}
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {productReviewUrl ? (
            <>
              <code className="block text-xs bg-gray-50 rounded-lg px-3 py-2 break-all text-navy-900">
                {productReviewUrl}
              </code>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={() => copyText(productReviewUrl, 'Product review link copied')}
                >
                  <Copy className="h-4 w-4 mr-1.5" /> Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    shareLink(
                      productReviewUrl,
                      `Review ${selectedProduct?.name || 'your piece'} at The House of Rani:`,
                    )
                  }
                >
                  <Share2 className="h-4 w-4 mr-1.5" /> Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={qrBusy}
                  onClick={() =>
                    makeQr(
                      productReviewUrl,
                      'The House of Rani',
                      selectedProduct?.name || 'Product review',
                      `HOR-review-${selectedProduct?._id || 'product'}.png`,
                    )
                  }
                >
                  <QrCode className="h-4 w-4 mr-1.5" /> Download QR
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">Select a product to generate a locked review link.</p>
          )}
        </div>
      </div>

      {qrPreview ? (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrPreview} alt="QR preview" className="h-48 w-auto rounded-xl border shadow-sm" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['pending', `Pending (${pendingCount})`],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
              ['all', 'All'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold',
                filter === key ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">{visible.length} shown</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {filter === 'pending'
              ? 'No pending stories. Share a link with customers to collect them.'
              : 'Nothing here yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {visible.map((t) => {
              const status = t.status || (t.isActive ? 'approved' : 'pending');
              return (
                <li key={t._id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start">
                  <div className="flex gap-2 shrink-0">
                    {(t.images || []).slice(0, 3).map((img, i) => (
                      <div
                        key={`${t._id}-${i}`}
                        className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100"
                      >
                        <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-navy-900">
                        {t.isAnonymous || !t.displayName ? 'Anonymous' : t.displayName}
                      </p>
                      <Badge
                        variant={
                          status === 'approved' ? 'success' : status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {status}
                      </Badge>
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {t.rating}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-3">{t.quote}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="brand"
                          disabled={busyId === t._id}
                          onClick={() => approve(t._id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === t._id}
                          onClick={() => reject(t._id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-red-600"
                      onClick={() => handleDelete(t._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

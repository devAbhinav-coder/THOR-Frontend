'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Archive } from 'lucide-react';
import { promotionApi } from '@/lib/api';
import { Promotion } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PromotionFormModal from '@/components/admin/PromotionFormModal';
import toast from 'react-hot-toast';
import {
  getPromotionLifecycle,
  promotionShowsOnPdp,
} from '@/lib/promotionLifecycle';

function lifecycleBadge(p: Promotion) {
  const lifecycle = getPromotionLifecycle(p);
  if (lifecycle === 'live') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="success">Live</Badge>
        {promotionShowsOnPdp(p) ?
          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
            On PDP
          </Badge>
        : null}
      </div>
    );
  }
  if (lifecycle === 'expired') {
    return (
      <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
        Expired
      </Badge>
    );
  }
  if (lifecycle === 'scheduled') {
    return <Badge variant="secondary">Scheduled</Badge>;
  }
  return <Badge variant="secondary">Inactive</Badge>;
}

function offerSummary(p: Promotion): string {
  if (p.promotionType === 'bogo') {
    const pct = p.getDiscountPercent ?? 100;
    if (pct >= 100) return `Buy ${p.buyQuantity ?? 1} Get ${p.getQuantity ?? 1} Free`;
    return `Buy ${p.buyQuantity ?? 1} Get ${p.getQuantity ?? 1} @ ${pct}% off`;
  }
  if (p.promotionType === 'percentage') {
    return `Buy ${p.buyQuantity ?? 1}+ · ${p.discountValue}% off`;
  }
  return `Buy ${p.buyQuantity ?? 1}+ · ₹${p.discountValue} off`;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionApi.getAll();
      const list = res.data?.promotions;
      setPromotions(Array.isArray(list) ? (list as Promotion[]) : []);
    } catch {
      toast.error('Failed to load auto offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this auto offer?')) return;
    try {
      await promotionApi.delete(id);
      toast.success('Offer deleted');
      fetchPromotions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"?`)) return;
    try {
      await promotionApi.archive(id);
      toast.success('Offer archived');
      fetchPromotions();
    } catch {
      toast.error('Failed to archive');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Cart · Auto apply</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Auto offers</h1>
        <p className="text-sm text-white/80 mt-1 max-w-2xl">
          Buy 1 Get 1, Buy 2 Get ₹200 off, and more — no coupon code needed. Offers apply automatically
          when matching items are in the cart. Scope by subcategory, category, or product.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {promotions.length} offer{promotions.length === 1 ? '' : 's'}
          {promotions.some((p) => getPromotionLifecycle(p) === 'expired') ?
            <span className="text-red-600">
              {' '}
              · expired offers won&apos;t show on PDP — extend the end date
            </span>
          : null}
        </p>
        <Button
          variant="brand"
          onClick={() => {
            setEditPromotion(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New auto offer
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No auto offers yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create Buy 1 Get 1 or quantity discounts that apply in cart automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Offer</th>
                  <th className="text-left px-5 py-3">Rule</th>
                  <th className="text-left px-5 py-3">Scope</th>
                  <th className="text-left px-5 py-3">Window</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promotions.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{p.displayTitle || p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{offerSummary(p)}</td>
                    <td className="px-5 py-3.5 text-sm capitalize text-gray-600">{p.scopeType}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      {lifecycleBadge(p)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          className="p-2 text-gray-400 hover:text-brand-700"
                          onClick={() => {
                            setEditPromotion(p);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-amber-700"
                          onClick={() => handleArchive(p._id, p.name)}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(p._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <PromotionFormModal
          promotion={editPromotion}
          onClose={() => {
            setIsModalOpen(false);
            setEditPromotion(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setEditPromotion(null);
            fetchPromotions();
          }}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Archive } from 'lucide-react';
import { couponApi } from '@/lib/api';
import { Coupon } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CouponFormModal from '@/components/admin/CouponFormModal';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await couponApi.getAll();
      const list = res.data?.coupons;
      setCoupons(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await couponApi.delete(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleArchive = async (id: string, code: string) => {
    if (!confirm(`Archive ${code}?`)) return;
    try {
      await couponApi.archive(id);
      toast.success('Coupon archived');
      fetchCoupons();
    } catch {
      toast.error('Failed to archive');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="bg-gradient-to-r from-emerald-800 via-navy-900 to-brand-700 rounded-2xl p-5 text-white shadow-lg shadow-navy-900/10">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Offers</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Coupons</h1>
        <p className="text-sm text-white/80 mt-1 max-w-2xl">
          Public offers show on the storefront visit popup, cart &amp; checkout. Code-only coupons
          stay hidden for influencers &amp; private promos — shoppers must type the code.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{coupons.length} coupons</p>
        <Button
          variant="brand"
          onClick={() => {
            setEditCoupon(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New coupon
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No coupons yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first coupon — public or code-only for influencers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-5 py-3 font-semibold">Offer</th>
                  <th className="px-5 py-3 font-semibold">Value</th>
                  <th className="px-5 py-3 font-semibold">Usage</th>
                  <th className="px-5 py-3 font-semibold">Expiry</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {coupon.imageUrl ? (
                            <div className="relative h-10 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-200/60">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={coupon.imageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <span className="font-mono text-sm font-bold text-navy-900 bg-gray-100 px-2 py-0.5 rounded-md">
                              {coupon.code}
                            </span>
                            {coupon.displayTitle ? (
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
                                {coupon.displayTitle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : coupon.discountType === 'fixed'
                            ? `At ${formatPrice(coupon.discountValue)}`
                            : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {coupon.usedCount}
                        {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(coupon.expiryDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={isExpired ? 'error' : coupon.isActive ? 'success' : 'warning'}
                            className="text-xs"
                          >
                            {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Off'}
                          </Badge>
                          {coupon.showOnStorefront === false ? (
                            <Badge variant="secondary" className="text-xs">
                              Code only
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Public
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCoupon(coupon);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Archive"
                            onClick={() => handleArchive(coupon._id, coupon.code)}
                            className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(coupon._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CouponFormModal
          coupon={editCoupon}
          onClose={() => {
            setIsModalOpen(false);
            setEditCoupon(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setEditCoupon(null);
            fetchCoupons();
          }}
        />
      )}
    </div>
  );
}

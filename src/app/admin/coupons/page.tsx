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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Offers</p>
          <h1 className="text-2xl font-serif font-semibold text-navy-900 mt-0.5">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create offers with a banner image — they show on the homepage for visitors to copy.
          </p>
        </div>
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-9 w-9 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No coupons yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-semibold">Offer</th>
                  <th className="px-4 py-3 font-semibold">Value</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {coupon.imageUrl ?
                            <div className="relative h-10 w-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={coupon.imageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>
                          : null}
                          <div className="min-w-0">
                            <span className="font-mono text-sm font-bold text-navy-900 bg-gray-100 px-2 py-0.5 rounded">
                              {coupon.code}
                            </span>
                            {coupon.displayTitle ?
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
                                {coupon.displayTitle}
                              </p>
                            : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : coupon.discountType === 'fixed'
                            ? `At ${formatPrice(coupon.discountValue)}`
                            : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {coupon.usedCount}
                        {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(coupon.expiryDate)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={isExpired ? 'error' : coupon.isActive ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Off'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCoupon(coupon);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-navy-900 hover:bg-gray-100 rounded-md"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Archive"
                            onClick={() => handleArchive(coupon._id, coupon.code)}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(coupon._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
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

'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Sparkles } from 'lucide-react';
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
      // silent fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

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

  const handleSave = () => {
    setIsModalOpen(false);
    setEditCoupon(null);
    fetchCoupons();
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Campaign Engine</p>
        <h1 className="text-2xl font-serif font-bold mt-1">Coupons</h1>
        <p className="text-sm text-white/80 mt-1">Build advanced offers: first-time users, returning buyers, and order-based targeting.</p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 hidden">Coupons</h1>
          <p className="text-gray-500 text-sm">{coupons.length} coupons</p>
        </div>
        <Button variant="brand" onClick={() => { setEditCoupon(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Create Coupon
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No coupons yet. Create your first coupon!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Value</th>
                  <th className="text-left px-5 py-3">Min Order</th>
                  <th className="text-left px-5 py-3">Eligibility</th>
                  <th className="text-left px-5 py-3">Usage</th>
                  <th className="text-left px-5 py-3">Expiry</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">{coupon.code}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 capitalize">{coupon.discountType}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100">
                          <Sparkles className="h-3 w-3 text-brand-600" />
                          {coupon.eligibilityType === 'first_order'
                            ? 'First-time only'
                            : coupon.eligibilityType === 'returning'
                              ? 'Returning only'
                              : 'All users'}
                        </div>
                        {(coupon.minCompletedOrders || coupon.maxCompletedOrders !== undefined) && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            Orders: {coupon.minCompletedOrders || 0}
                            {coupon.maxCompletedOrders !== undefined ? ` - ${coupon.maxCompletedOrders}` : '+'}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''} · user {coupon.userUsageLimit || 1}x
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(coupon.expiryDate)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={isExpired ? 'error' : coupon.isActive ? 'success' : 'warning'} className="text-xs">
                          {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditCoupon(coupon); setIsModalOpen(true); }}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-md"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
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
          onClose={() => { setIsModalOpen(false); setEditCoupon(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

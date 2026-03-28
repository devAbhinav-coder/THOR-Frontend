'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Coupon } from '@/types';
import { couponApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface Props {
  coupon: Coupon | null;
  onClose: () => void;
  onSave: () => void;
}

export default function CouponFormModal({ coupon, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || '',
    minOrderAmount: coupon?.minOrderAmount || '',
    maxDiscountAmount: coupon?.maxDiscountAmount || '',
    usageLimit: coupon?.usageLimit || '',
    userUsageLimit: coupon?.userUsageLimit || 1,
    eligibilityType: coupon?.eligibilityType || 'all',
    minCompletedOrders: coupon?.minCompletedOrders || 0,
    maxCompletedOrders: coupon?.maxCompletedOrders || '',
    startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    expiryDate: coupon ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
    isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      toast.error('Please set an expiry date');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        userUsageLimit: Number(formData.userUsageLimit),
        eligibilityType: formData.eligibilityType,
        minCompletedOrders: Number(formData.minCompletedOrders || 0),
        maxCompletedOrders: formData.maxCompletedOrders !== '' ? Number(formData.maxCompletedOrders) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      if (coupon) {
        await couponApi.update(coupon._id, payload);
        toast.success('Coupon updated');
      } else {
        await couponApi.create(payload);
        toast.success('Coupon created');
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Coupon Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'flat' })}
                className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <Input
              label={`Discount Value ${formData.discountType === 'percentage' ? '(%)' : '(₹)'} *`}
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              required
            />
            <Input
              label="Min Order Amount (₹)"
              type="number"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              placeholder="0"
            />
            {formData.discountType === 'percentage' && (
              <Input
                label="Max Discount (₹)"
                type="number"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                placeholder="No limit"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <Input
              label="Total Usage Limit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
            />
            <Input
              label="Per User Limit"
              type="number"
              value={formData.userUsageLimit}
              onChange={(e) => setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) || 1 })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility *</label>
              <select
                value={formData.eligibilityType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eligibilityType: e.target.value as 'all' | 'first_order' | 'returning',
                  })
                }
                className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All users</option>
                <option value="first_order">First-time users only</option>
                <option value="returning">Returning users only</option>
              </select>
            </div>
            <Input
              label="Min Completed Orders"
              type="number"
              value={formData.minCompletedOrders}
              onChange={(e) => setFormData({ ...formData, minCompletedOrders: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Max Completed Orders"
              type="number"
              value={formData.maxCompletedOrders}
              onChange={(e) => setFormData({ ...formData, maxCompletedOrders: e.target.value })}
              placeholder="No upper limit"
            />
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Get 20% off on orders above ₹999"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-brand-600"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </form>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1" loading={isSaving} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {coupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </div>
    </div>
  );
}

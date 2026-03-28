'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Camera, Package, ArrowRight, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi, orderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getMyOrders({ page: 1, limit: 3 });
        setRecentOrders(res.data.orders || []);
      } catch {
        // silent fail
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.phone) formData.append('phone', data.phone);

      const res = await authApi.updateMe(formData);
      setUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('name', user?.name || '');
      if (user?.phone) fd.append('phone', user.phone);
      fd.append('avatar', file);
      const res = await authApi.updateMe(fd);
      setUser(res.data.user);
      toast.success('Profile photo updated');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const onDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await authApi.deleteMe();
      await logout();
      toast.success('Your account has been deleted');
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-100 to-navy-100 flex items-center justify-center ring-2 ring-brand-50">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-brand-700 font-bold text-2xl">{user?.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 h-6 w-6 bg-brand-600 rounded-full flex items-center justify-center text-white hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isUploadingAvatar ? <span className="h-3 w-3 rounded-full border border-white/40 border-t-white animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage your account details here</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <Input {...register('name')} label="Full Name" error={errors.name?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <Input {...register('phone')} type="tel" label="Phone Number" error={errors.phone?.message} maxLength={10} />
          <Button type="submit" variant="brand" loading={isUpdating} className="w-full sm:w-auto">Save Changes</Button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-600" /> Recent Orders
          </h3>
          <Link href="/dashboard/orders" className="text-sm text-brand-600 font-semibold hover:text-brand-700 inline-flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isLoadingOrders ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="h-14 bg-gray-100 rounded-xl" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet. Start shopping to see your orders here.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <Link key={o._id} href={`/dashboard/orders/${o._id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{o.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(o.total)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 inline-flex items-center gap-1">
                      {o.status === 'delivered' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3 text-amber-600" />}
                      <span className="capitalize">{o.status}</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Account security</p>
        <p className="text-sm text-white/90 mt-1">Need to update your password or secure account settings?</p>
        <Link href="/dashboard/security" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold bg-white text-navy-900 px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          Open Security Settings <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="pt-1">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Need to close your account?</p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-2"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Account
        </Button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900">Close your account?</h3>
            <p className="text-sm text-gray-500 mt-1">
              If you are sure, type <span className="font-semibold text-gray-900">DELETE</span> to continue.
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full mt-4 h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={onDeleteAccount}
                loading={isDeletingAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

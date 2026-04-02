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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Profile Header & Info Card */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm relative">
        {/* Cover Photo Area */}
        <div className="h-28 sm:h-36 bg-gradient-to-tr from-navy-900 via-brand-800 to-brand-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>

        <div className="px-5 sm:px-8 pb-8">
          <div className="flex justify-between items-start sm:items-end -mt-10 sm:-mt-12 mb-6 flex-col sm:flex-row gap-4">
            {/* Avatar Group */}
            <div className="relative z-10">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white flex items-center justify-center p-1 shadow-lg border-2 border-white">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-navy-50 to-brand-50 flex items-center justify-center overflow-hidden relative group">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-brand-700 font-black text-3xl">{user?.name.charAt(0).toUpperCase()}</span>
                  )}
                  {/* Hover Overlay for desktop */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
              {/* Mobile explicitly visible camera button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 h-8 w-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-navy-800 hover:text-brand-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
              >
                {isUploadingAvatar ? <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">{user?.name}</h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input {...register('name')} label="Full Name" placeholder="Your full name" error={errors.name?.message} className="bg-gray-50/50" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 focus-within:text-brand-600 transition-colors">Email Address</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed shadow-inner"
                />
                <p className="text-[10px] font-medium text-gray-400 mt-1.5 px-1 uppercase tracking-wider">Email is verified & linked</p>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <Input {...register('phone')} type="tel" label="Phone Number" placeholder="e.g. 9876543210" error={errors.phone?.message} maxLength={10} className="bg-gray-50/50" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <Button type="submit" variant="brand" loading={isUpdating} className="w-full sm:w-auto px-8 rounded-xl font-bold shadow-lg shadow-brand-500/20">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
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
              <Link key={o._id} href={`/dashboard/orders/${encodeURIComponent(o._id)}`} className="block p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-gray-50 transition-all">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Widget */}
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-navy-900/20">
          {/* Subtle bg accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 mb-4 border border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Account Secured
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2">Password & Security</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-sm">Keep your account safe. Update your password regularly and monitor connected devices.</p>
            </div>
            
            <div className="mt-8">
              <Link href="/dashboard/security" className="inline-flex items-center justify-between w-full sm:w-auto gap-3 text-sm font-bold bg-white text-navy-900 px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-md active:scale-95 group">
                Open Security Hub <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl border border-red-100 p-6 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {/* Subtle bg accent */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] uppercase tracking-widest font-black mb-4 border border-red-100">
              Danger Zone
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-2">Delete Account</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Permanently delete your account and remove all personal data, order history, and saved addresses. This action is irreversible.</p>
          </div>

          <div className="mt-8 relative z-10">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-red-600 bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all active:scale-95"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Permanently Delete
            </button>
          </div>
        </div>
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

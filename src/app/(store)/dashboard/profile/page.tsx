'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Camera, BadgeCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AccountFormField } from '@/components/dashboard/account/AccountFormField';
import ActiveDevicesWidget from '@/components/dashboard/account/ActiveDevicesWidget';
import DeleteAccountSection from '@/components/dashboard/account/DeleteAccountSection';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;
const MAX_AVATAR_SIZE_MB = 8;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

function patronSince(createdAt?: string): string {
  if (!createdAt) return 'PATRON';
  const year = new Date(createdAt).getFullYear();
  return `PATRON SINCE ${year}`;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

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
      toast.error((err as { message?: string }).message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error(`Profile photo must be under ${MAX_AVATAR_SIZE_MB}MB`);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
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

  return (
    <div className="flex flex-col gap-account-stack-lg pb-6">
      {/* Profile header banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-account-primary via-navy-800 to-account-secondary p-6 md:p-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_55%)]" />
        <div className="relative flex items-center gap-5 md:gap-6">
          <div className="relative shrink-0">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-2 border-white/30 overflow-hidden bg-account-primary-container">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} width={96} height={96} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-3xl font-serif">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white text-account-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform disabled:opacity-60"
              aria-label="Change profile photo"
            >
              {isUploadingAvatar ? (
                <span className="h-4 w-4 rounded-full border-2 border-account-outline-variant border-t-account-primary animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
          <div className="min-w-0 text-white">
            <h1 className="font-serif text-2xl md:text-3xl truncate">{user?.name}</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 mt-1">
              {patronSince(user?.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-account-gutter">
        {/* Personal information */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-account-primary">Personal Information</h2>
            <p className="text-sm text-account-on-surface-variant mt-1">
              Manage your identity and contact details.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onProfileSubmit)}
            className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8 space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <AccountFormField
                label="Full Name"
                placeholder="Your full name"
                error={errors.name?.message}
                {...register('name')}
              />
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-account-on-surface-variant">
                  Email Address
                </label>
                <div className="flex items-center gap-2 border-b border-account-outline-variant/50 pb-2">
                  <span className="text-account-primary text-base truncate flex-1">{user?.email}</span>
                  {user?.emailVerified && (
                    <BadgeCheck className="h-5 w-5 text-account-secondary shrink-0" aria-label="Verified email" />
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-account-outline">Email cannot be changed here</p>
              </div>
              <AccountFormField
                label="Phone Number"
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                error={errors.phone?.message}
                className="sm:col-span-2 lg:col-span-1"
                {...register('phone')}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className={cn(
                'w-full sm:w-auto min-w-[220px] bg-account-primary text-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] hover:opacity-90 transition-opacity disabled:opacity-60',
              )}
            >
              {isUpdating ? 'Saving…' : 'Save Profile Changes'}
            </button>
          </form>

          <DeleteAccountSection variant="profile" />
        </section>

        {/* Sidebar widgets — no Elite Curation (not supported by backend) */}
        <aside className="lg:col-span-4 flex flex-col gap-account-gutter">
          <ActiveDevicesWidget compact />
        </aside>
      </div>
    </div>
  );
}

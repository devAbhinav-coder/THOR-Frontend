'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Laptop } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { ActiveSessionsPanel } from '@/components/auth/ActiveSessionsPanel';
import { useDedupeSubmit } from '@/hooks/useDedupeSubmit';
import toast from 'react-hot-toast';

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Include uppercase, lowercase and number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Form = z.infer<typeof schema>;

export default function SecurityPage() {
  const { loading: isSaving, run } = useDedupeSubmit();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<Form>({
    resolver: zodResolver(schema),
  });
  const newPassword = watch('newPassword');

  const onSubmit = async (data: Form) => {
    await run(async () => {
      await authApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully. Other devices were signed out.');
      reset();
    }).catch((err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to change password');
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Security</p>
        <h2 className="font-semibold text-xl mt-1">Keep Your Account Safe</h2>
        <p className="text-sm text-white/80 mt-1">
          Manage passwords and active sign-ins. Unusual activity? Sign out other devices below.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Laptop className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Active devices</h3>
            <p className="text-sm text-gray-500">Sessions where you are currently signed in</p>
          </div>
        </div>
        <ActiveSessionsPanel />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Updating your password signs out other devices</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <Input
            {...register('currentPassword')}
            type="password"
            label="Current Password"
            error={errors.currentPassword?.message}
          />
          <Input
            {...register('newPassword')}
            type="password"
            label="New Password"
            error={errors.newPassword?.message}
          />
          <PasswordStrengthMeter
            password={newPassword || ''}
            className="space-y-1"
            variant="light"
          />
          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm New Password"
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" variant="brand" loading={isSaving} className="w-full sm:w-auto">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}

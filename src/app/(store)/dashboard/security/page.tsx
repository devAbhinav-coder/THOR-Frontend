'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { authApi } from '@/lib/api';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import ActiveDevicesWidget from '@/components/dashboard/account/ActiveDevicesWidget';
import DeleteAccountSection from '@/components/dashboard/account/DeleteAccountSection';
import { AccountFormField } from '@/components/dashboard/account/AccountFormField';
import { useDedupeSubmit } from '@/hooks/useDedupeSubmit';
import toast from 'react-hot-toast';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
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
      toast.error((err as { message?: string }).message || 'Failed to change password');
    });
  };

  return (
    <div className="flex flex-col gap-account-stack-lg pb-6">
      {/* Header banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-account-primary via-navy-900 to-account-secondary p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_bottom_left,_white_0%,_transparent_60%)]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Security</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-2">Keep Your Account Safe</h1>
          <p className="text-sm text-white/80 mt-2 max-w-2xl">
            Manage passwords and active sign-ins. Unusual activity? Sign out other devices below.
          </p>
        </div>
      </section>

      <ActiveDevicesWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-account-gutter">
        {/* Change password — 2FA omitted (not supported by backend) */}
        <section className="bg-account-surface-container-lowest border border-account-outline-variant/30 p-6 md:p-8">
          <div className="flex items-start gap-3 mb-8">
            <Shield className="h-5 w-5 text-account-secondary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-serif text-xl text-account-primary">Change Password</h2>
              <p className="text-sm text-account-on-surface-variant mt-1">
                Updating your password signs out other devices.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AccountFormField
              label="Current Password"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <AccountFormField
              label="New Password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordStrengthMeter password={newPassword || ''} className="space-y-1 -mt-4" variant="light" />
            <AccountFormField
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-account-secondary text-white py-4 text-[11px] font-semibold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>

        <section className="bg-account-surface-container border border-account-outline-variant/30 p-6 md:p-8 flex flex-col justify-center">
          <h2 className="font-serif text-xl text-account-primary mb-2">Account Protection</h2>
          <p className="text-sm text-account-on-surface-variant leading-relaxed">
            Your account is secured with email verification and encrypted passwords. Two-factor authentication is not enabled on this store yet — use a strong unique password and review active devices regularly.
          </p>
        </section>
      </div>

      <DeleteAccountSection variant="security" />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Include uppercase, lowercase and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type Form = z.infer<typeof schema>;

export default function SecurityPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setIsSaving(true);
    try {
      await authApi.updatePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      reset();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-navy-900 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">Security</p>
        <h2 className="font-semibold text-xl mt-1">Keep Your Account Safe</h2>
        <p className="text-sm text-white/80 mt-1">Use a strong password with uppercase, lowercase, and numbers.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Keep your account secure with a strong password</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <Input {...register('currentPassword')} type="password" label="Current Password" error={errors.currentPassword?.message} />
          <Input {...register('newPassword')} type="password" label="New Password" error={errors.newPassword?.message} />
          <Input {...register('confirmPassword')} type="password" label="Confirm New Password" error={errors.confirmPassword?.message} />
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Minimum 8 characters</li>
            <li>• Include uppercase + lowercase + number</li>
            <li>• Avoid using your name/email</li>
          </ul>
          <Button type="submit" variant="brand" loading={isSaving} className="w-full sm:w-auto">Update Password</Button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])/, 'Include a lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Include an uppercase letter')
      .regex(/(?=.*\d)/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordClient() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSendCode = async (data: EmailForm) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep('reset');
      toast.success('If an account exists for this email, a code was sent.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    setLoading(true);
    try {
      const parsed = await authApi.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      useAuthStore.setState({ token: null, user: parsed.data.user, isAuthenticated: true });
      toast.success('Password updated. You are signed in.');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">Set a new password</h2>
            <p className="text-white/50 mt-2 text-sm">
              Code sent to <span className="text-white/80 font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
            <Input
              {...resetForm.register('otp')}
              inputMode="numeric"
              maxLength={6}
              label="6-digit code"
              placeholder="000000"
              error={resetForm.formState.errors.otp?.message}
              autoComplete="one-time-code"
            />
            <div className="relative">
              <Input
                {...resetForm.register('newPassword')}
                type={showPwd ? 'text' : 'password'}
                label="New password"
                error={resetForm.formState.errors.newPassword?.message}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              {...resetForm.register('confirmPassword')}
              type="password"
              label="Confirm new password"
              error={resetForm.formState.errors.confirmPassword?.message}
              autoComplete="new-password"
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={loading}>
              Update password & sign in
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="flex w-full items-center justify-center gap-1 text-sm text-white/40 hover:text-white/70"
            >
              <ArrowLeft className="h-4 w-4" /> Use a different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">Forgot password</h2>
          <p className="text-white/50 mt-1 text-sm">We&apos;ll email you a 6-digit code to reset your password</p>
        </div>

        <form onSubmit={emailForm.handleSubmit(onSendCode)} className="space-y-4">
          <Input
            {...emailForm.register('email')}
            type="email"
            label="Email address"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            autoComplete="email"
          />
          <Button type="submit" variant="brand" size="lg" className="w-full" loading={loading}>
            Send code
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

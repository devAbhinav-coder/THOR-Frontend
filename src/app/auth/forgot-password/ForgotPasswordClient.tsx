'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthNavLink from '@/components/auth/AuthNavLink';
import {
  AuthFormRoot,
  AuthFormHeader,
  AuthFormFooter,
  AuthBackButton,
  AuthStepBar,
} from '@/components/auth/AuthFormChrome';
import { authLinkText } from '@/lib/authFormShell';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { OtpResendCooldown } from '@/components/auth/OtpResendCooldown';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useDedupeSubmit } from '@/hooks/useDedupeSubmit';
import {
  clearForgotPasswordVerifyIdempotencyKey,
  formatOtpRetryMessage,
  otpRetryAfterFromSuccess,
  parseApiClientError,
  DEFAULT_OTP_COOLDOWN_SEC,
} from '@/lib/authOtpClient';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resetSchema = z
  .object({
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
type OtpForm = z.infer<typeof otpSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type ForgotPasswordClientProps = {
  embedded?: boolean;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
};

export default function ForgotPasswordClient({
  embedded = false,
  onSuccess,
  onBackToLogin,
}: ForgotPasswordClientProps = {}) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [resendResetKey, setResendResetKey] = useState(0);
  const [resendCooldownSec, setResendCooldownSec] = useState(DEFAULT_OTP_COOLDOWN_SEC);
  const [verifyCooldownSec, setVerifyCooldownSec] = useState(0);
  const { loading, run } = useDedupeSubmit();
  const router = useRouter();

  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  const navigateAfterAuth = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push('/');
  };

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const newPasswordWatch = resetForm.watch('newPassword');

  useEffect(() => {
    if (verifyCooldownSec <= 0) return;
    const id = window.setTimeout(() => {
      setVerifyCooldownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [verifyCooldownSec]);

  const onSendCode = async (data: EmailForm) => {
    await run(async () => {
      const res = await authApi.forgotPassword({ email: data.email });
      setEmail(data.email);
      setResendCooldownSec(otpRetryAfterFromSuccess(res));
      setResendResetKey((k) => k + 1);
      setVerifyCooldownSec(0);
      setStep('otp');
      toast.success('If an account exists for this email, a code was sent.');
    }).catch((err: unknown) => {
      const { message, retryAfter } = parseApiClientError(err);
      if (retryAfter) setResendCooldownSec(retryAfter);
      toast.error(formatOtpRetryMessage(message, retryAfter));
    });
  };

  const onVerifyOtp = async (data: OtpForm) => {
    if (verifyCooldownSec > 0) return;
    await run(async () => {
      const res = await authApi.verifyOtpForgot({ email, otp: data.otp });
      const token = res.data?.resetToken;
      if (!token) {
        toast.error('Verification succeeded but reset session is missing. Try again.');
        return;
      }
      clearForgotPasswordVerifyIdempotencyKey(email);
      setResetToken(token);
      setVerifyCooldownSec(0);
      setStep('reset');
      toast.success('Code verified. Choose a new password.');
    }).catch((err: unknown) => {
      const { message, retryAfter } = parseApiClientError(err);
      if (retryAfter) setVerifyCooldownSec(retryAfter);
      toast.error(formatOtpRetryMessage(message, retryAfter));
    });
  };

  const onReset = async (data: ResetForm) => {
    await run(async () => {
      const parsed = resetToken ?
        await authApi.resetPasswordWithToken({
          resetToken,
          newPassword: data.newPassword,
        })
      : await authApi.resetPassword({
          email,
          otp: otpForm.getValues('otp'),
          newPassword: data.newPassword,
        });
      useAuthStore.setState({
        token: null,
        user: parsed.data.user,
        isAuthenticated: true,
      });
      toast.success('Password updated. You are signed in.');
      navigateAfterAuth();
    }).catch((err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || 'Could not reset password.');
    });
  };

  if (step === 'reset') {
    return (
      <AuthFormRoot embedded={embedded}>
        {embedded ? <AuthStepBar total={3} current={2} /> : null}
        <AuthFormHeader
          embedded={embedded}
          title="Set a new password"
          subtitle={`For ${email}`}
          icon={<KeyRound className="h-5 w-5" />}
        />
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-3">
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
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={newPasswordWatch || ''} />
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
          <AuthBackButton embedded={embedded} onClick={() => setStep('otp')}>
            <ArrowLeft className="h-4 w-4" /> Back to code entry
          </AuthBackButton>
        </form>
      </AuthFormRoot>
    );
  }

  if (step === 'otp') {
    return (
      <AuthFormRoot embedded={embedded}>
        {embedded ? <AuthStepBar total={3} current={1} /> : null}
        <AuthFormHeader
          embedded={embedded}
          title="Enter verification code"
          subtitle={`Sent to ${email}`}
        />
        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-3">
          <Input
            {...otpForm.register('otp')}
            inputMode="numeric"
            maxLength={6}
            label="6-digit code"
            placeholder="000000"
            error={otpForm.formState.errors.otp?.message}
            autoComplete="one-time-code"
          />
          <OtpResendCooldown
            email={email}
            type="forgot_password"
            resetKey={resendResetKey}
            initialSeconds={resendCooldownSec}
          />
          {verifyCooldownSec > 0 && (
            <p className="text-center text-sm text-amber-700">
              Too many attempts. Try again in {verifyCooldownSec}s.
            </p>
          )}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={verifyCooldownSec > 0}
          >
            {verifyCooldownSec > 0 ? `Verify in ${verifyCooldownSec}s` : 'Verify code'}
          </Button>
          <AuthBackButton embedded={embedded} onClick={() => setStep('email')}>
            <ArrowLeft className="h-4 w-4" /> Use a different email
          </AuthBackButton>
        </form>
      </AuthFormRoot>
    );
  }

  return (
    <AuthFormRoot embedded={embedded}>
      {embedded ? <AuthStepBar total={3} current={stepIndex} /> : null}
      <AuthFormHeader
        embedded={embedded}
        title="Reset your password"
        subtitle={embedded ? undefined : "We will email you a secure 6-digit code"}
      />
      <form onSubmit={emailForm.handleSubmit(onSendCode)} className="space-y-3">
        <Input
          {...emailForm.register('email')}
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={emailForm.formState.errors.email?.message}
          autoComplete="email"
        />
        <Button type="submit" variant="brand" size="lg" className="w-full" loading={loading}>
          Send code
        </Button>
      </form>
      <AuthFormFooter embedded={embedded}>
        <AuthNavLink
          embedded={embedded}
          onNavigate={onBackToLogin}
          href="/auth/login"
          className={`inline-flex items-center gap-1 ${authLinkText(embedded)}`}
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </AuthNavLink>
      </AuthFormFooter>
    </AuthFormRoot>
  );
}

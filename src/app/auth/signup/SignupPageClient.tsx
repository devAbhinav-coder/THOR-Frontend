'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Eye, EyeOff, UserPlus, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { OtpResendCooldown } from '@/components/auth/OtpResendCooldown';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/(?=.*[a-z])/, 'Include a lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Include an uppercase letter')
  .regex(/(?=.*\d)/, 'Include a number');

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone is required')
      .refine(
        (val) => {
          const d = val.replace(/\D/g, '');
          if (d.length !== 10 || !/^[6-9]/.test(d)) return false;
          return isValidPhoneNumber(`+91${d}`, 'IN');
        },
        { message: 'Enter a valid Indian mobile number' }
      ),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email'),
});

type OtpForm = z.infer<typeof otpSchema>;

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function googleIframeWidth(): number {
  if (typeof window === 'undefined') return 320;
  const viewport = window.innerWidth;
  if (viewport < 380) return 230;
  if (viewport < 430) return 250;
  if (viewport < 500) return 280;
  return 320;
}

export default function SignupPageClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleUiReady, setGoogleUiReady] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(320);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const { signupStart, signupVerify, loginWithGoogle, isLoading } = useAuthStore();
  const router = useRouter();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSubmitForm = async (data: SignupForm) => {
    try {
      const phoneDigits = data.phone.replace(/\D/g, '');
      await signupStart({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: phoneDigits,
      });
      setPendingEmail(data.email);
      setStep('otp');
      toast.success('We sent a 6-digit code to your email.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Could not send verification email.');
    }
  };

  const onSubmitOtp = async (data: OtpForm) => {
    try {
      await signupVerify(pendingEmail, data.otp);
      toast.success('Account verified. Welcome to The House of Rani!');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Invalid or expired code.');
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (isLoading) return;
    if (!credential) {
      toast.error('Google sign-up did not return a credential.');
      return;
    }
    try {
      await loginWithGoogle(credential);
      toast.success('Welcome! Your account is ready.');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Google sign-up failed.');
    }
  };

  const updateGoogleButtonWidth = useCallback(() => {
    setGoogleButtonWidth(googleIframeWidth());
  }, []);

  useEffect(() => {
    setGoogleButtonWidth(googleIframeWidth());
    setGoogleUiReady(true);
  }, []);

  useEffect(() => {
    if (!googleUiReady) return;
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(updateGoogleButtonWidth, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [googleUiReady, updateGoogleButtonWidth]);

  if (step === 'otp') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">Check your email</h2>
            <p className="text-white/50 mt-2 text-sm">
              Enter the 6-digit code we sent to{' '}
              <span className="text-white/80 font-medium">{pendingEmail}</span>
            </p>
          </div>

          <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
            <Input
              {...otpForm.register('otp')}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              label="Verification code"
              placeholder="000000"
              error={otpForm.formState.errors.otp?.message}
            />
            <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
              Verify & create account
            </Button>
            <OtpResendCooldown email={pendingEmail} type="signup" />
            <button
              type="button"
              onClick={() => {
                setStep('form');
                otpForm.reset();
              }}
              className="w-full text-sm text-white/40 hover:text-white/70"
            >
              ← Back to edit details
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white [&_input::placeholder]:text-white/30 [&_input:focus]:border-brand-600">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">Create Account</h2>
          <p className="text-white/50 mt-1 text-sm">Join The House of Rani — verify your email to finish</p>
        </div>

        {googleClientId ? (
          <div className="mb-6 w-full flex flex-col items-center overflow-hidden min-h-[40px]">
            {googleUiReady ?
              <GoogleLogin
                theme="outline"
                size="large"
                width={googleButtonWidth}
                text="signup_with"
                shape="rectangular"
                logo_alignment="center"
                use_fedcm_for_button={false}
                onSuccess={(cred) => void handleGoogle(cred.credential)}
                onError={() => toast.error('Google sign-up was cancelled or failed.')}
              />
            : null}
          </div>
        ) : (
          <p className="mb-6 text-center text-[11px] text-white/35">
            Google sign-up is not configured (set NEXT_PUBLIC_GOOGLE_CLIENT_ID).
          </p>
        )}

        {googleClientId ? (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-navy-900 px-3 text-white/35">or register with email</span>
            </div>
          </div>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
          <Input
            {...form.register('name')}
            label="Full Name"
            placeholder="Your full name"
            error={form.formState.errors.name?.message}
            autoComplete="name"
          />
          <Input
            {...form.register('email')}
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            error={form.formState.errors.email?.message}
            autoComplete="email"
          />
          <Input
            {...form.register('phone')}
            type="tel"
            label="Phone Number"
            placeholder="10-digit mobile number"
            error={form.formState.errors.phone?.message}
            maxLength={10}
          />

          <div className="relative">
            <Input
              {...form.register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a strong password"
              error={form.formState.errors.password?.message}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            {...form.register('confirmPassword')}
            type="password"
            label="Confirm Password"
            placeholder="Repeat your password"
            error={form.formState.errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
            <UserPlus className="h-4 w-4 mr-2" />
            Send verification code
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/40">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-xs text-white/25 text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white/50">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-white/50">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPageClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(320);
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (!credential) {
      toast.error("Google sign-in did not return a credential.");
      return;
    }
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  useEffect(() => {
    const updateGoogleButtonWidth = () => {
      const viewport = window.innerWidth;
      if (viewport < 380) setGoogleButtonWidth(230);
      else if (viewport < 430) setGoogleButtonWidth(250);
      else if (viewport < 500) setGoogleButtonWidth(280);
      else setGoogleButtonWidth(320);
    };
    updateGoogleButtonWidth();
    window.addEventListener("resize", updateGoogleButtonWidth);
    return () => window.removeEventListener("resize", updateGoogleButtonWidth);
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white [&_input::placeholder]:text-white/30 [&_input:focus]:border-brand-600">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">Welcome back</h2>
          <p className="text-white/50 mt-1 text-sm">Sign in to your account to continue</p>
        </div>

        {googleClientId ? (
          <div className="mb-6 w-full flex flex-col items-center overflow-hidden">
            <GoogleLogin
              theme="outline"
              size="large"
              width={googleButtonWidth}
              text="continue_with"
              shape="rectangular"
              logo_alignment="center"
              onSuccess={(cred) => void handleGoogle(cred.credential)}
              onError={() => toast.error("Google sign-in was cancelled or failed.")}
            />
          </div>
        ) : (
          <p className="mb-6 text-center text-[11px] text-white/35">
            Google sign-in is not configured (set NEXT_PUBLIC_GOOGLE_CLIENT_ID).
          </p>
        )}

        {googleClientId ? (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-navy-900 px-3 text-white/35">or email</span>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("email")}
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
          />

          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Your password"
              error={errors.password?.message}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="brand" size="lg" className="w-full" loading={isLoading}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

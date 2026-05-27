import type { Metadata } from "next";
import { Suspense } from "react";
import AuthRouteRedirect from "@/components/auth/AuthRouteRedirect";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-white/50 text-sm">
          Opening password reset…
        </div>
      }
    >
      <AuthRouteRedirect view="forgot" />
    </Suspense>
  );
}

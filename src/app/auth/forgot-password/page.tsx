import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password | The House of Rani",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-white/50 text-sm">
          Loading password reset…
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}

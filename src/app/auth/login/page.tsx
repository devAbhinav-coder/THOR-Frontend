import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Sign In | The House of Rani",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-white/50 text-sm">
          Loading sign in…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}

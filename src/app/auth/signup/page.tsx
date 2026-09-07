import type { Metadata } from "next";
import { Suspense } from "react";
import SignupPageClient from "./SignupPageClient";

export const metadata: Metadata = {
  title: "Create Account | The House of Rani",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-white/50 text-sm">
          Loading sign up…
        </div>
      }
    >
      <SignupPageClient />
    </Suspense>
  );
}

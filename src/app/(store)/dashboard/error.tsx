"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    void import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold text-navy-900">Account page failed</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {error.message || "Something went wrong in your account."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="brand" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/dashboard" className="text-sm font-medium text-brand-700 hover:underline">
            Back to account
          </Link>
        </div>
      </div>
    </div>
  );
}

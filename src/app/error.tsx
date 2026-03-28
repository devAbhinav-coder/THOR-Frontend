'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {error.message || 'An unexpected error occurred. You can try again or return home.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="brand" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

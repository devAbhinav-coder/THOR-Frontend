'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 antialiased">
        <div className="max-w-md text-center rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            {error.message || 'A critical error occurred. Please refresh the page.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

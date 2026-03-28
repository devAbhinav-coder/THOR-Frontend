import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md min-h-[320px] flex items-center justify-center text-white/50 text-sm">Loading…</div>}>
      <LoginPageClient />
    </Suspense>
  );
}

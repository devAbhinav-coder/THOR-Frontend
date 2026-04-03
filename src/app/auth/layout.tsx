import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import AuthGoogleShell from "./AuthGoogleShell";
import AuthGuestOnly from "@/components/auth/AuthGuestOnly";

function AuthBodyFallback() {
  return (
    <div className='flex-1 flex items-center justify-center px-4 pb-12'>
      <div
        className='w-full max-w-md h-80 rounded-2xl bg-navy-900/40 border border-navy-800 animate-pulse'
        aria-hidden
      />
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGoogleShell>
      <div className='min-h-screen bg-navy-950 flex flex-col'>
        <header className='p-6'>
          <Link href='/' className='inline-block'>
            <Image
              src='/logo.png'
              alt='The House of Rani'
              width={140}
              height={44}
              className='h-11 w-auto object-contain'
            />
          </Link>
        </header>

        <Suspense fallback={<AuthBodyFallback />}>
          <AuthGuestOnly>{children}</AuthGuestOnly>
        </Suspense>

        <div className='h-1 w-full bg-gradient-to-r from-navy-900 via-brand-600 to-navy-900' />
      </div>
    </AuthGoogleShell>
  );
}

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Footer from '@/components/layout/Footer';
import { StoreErrorBoundary } from '@/components/StoreErrorBoundary';
import { StoreRaniCare } from '@/components/support/StoreRaniCare';

const Navbar = dynamic(() => import('@/components/layout/Navbar'), {
  loading: () => (
    <div
      className='sticky top-0 z-50 h-16 border-b border-navy-800 bg-navy-950'
      role='status'
      aria-label='Loading navigation'
    />
  ),
});

const navFallback = (
  <div
    className='sticky top-0 z-50 h-16 border-b border-navy-800 bg-navy-950'
    role='status'
    aria-label='Loading navigation'
  />
);

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={navFallback}>
        <Navbar />
      </Suspense>
      <main className="pb-0 lg:pb-0 min-h-screen flex flex-col ">
        <StoreErrorBoundary>{children}</StoreErrorBoundary>
      </main>
      <Footer />
      <StoreRaniCare />
    </>
  );
}

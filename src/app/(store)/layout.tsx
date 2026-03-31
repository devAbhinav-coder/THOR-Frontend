import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { StoreErrorBoundary } from '@/components/StoreErrorBoundary';
import { StoreRaniCare } from '@/components/support/StoreRaniCare';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pb-0 lg:pb-0 min-h-screen flex flex-col ">
        <StoreErrorBoundary>{children}</StoreErrorBoundary>
      </main>
      <Footer />
      <StoreRaniCare />
    </>
  );
}

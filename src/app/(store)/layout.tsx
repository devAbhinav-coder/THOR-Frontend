import { Suspense } from "react";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import { StoreErrorBoundary } from "@/components/StoreErrorBoundary";
import { StoreRaniCare } from "@/components/support/StoreRaniCare";
import StoreAuthModal from "@/components/auth/StoreAuthModal";
import StoreVisitTracker from "@/components/analytics/StoreVisitTracker";
import WishlistRehydrator from "@/components/wishlist/WishlistRehydrator";
import { fetchShopNavCategoriesServer } from "@/lib/categoryServer";
import Navbar from "@/components/layout/Navbar";

const OfferVisitPopup = dynamic(() => import("@/components/coupons/OfferVisitPopup"));

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialNavCategories = await fetchShopNavCategoriesServer();

  return (
    <>
      <WishlistRehydrator />
      <StoreVisitTracker />
      <Navbar initialNavCategories={initialNavCategories} />
      <main className='isolate min-h-screen flex flex-col bg-background pb-0 lg:pb-0'>
        <StoreErrorBoundary>{children}</StoreErrorBoundary>
      </main>
      <Footer initialNavCategories={initialNavCategories} />
      <StoreRaniCare />
      <OfferVisitPopup />
      <Suspense fallback={null}>
        <StoreAuthModal />
      </Suspense>
    </>
  );
}

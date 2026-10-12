import { Suspense } from "react";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import { StoreErrorBoundary } from "@/components/StoreErrorBoundary";
import { StoreRaniCare } from "@/components/support/StoreRaniCare";
import StoreAuthModal from "@/components/auth/StoreAuthModal";
import StoreVisitTracker from "@/components/analytics/StoreVisitTracker";
import SessionReplayRecorder from "@/components/analytics/SessionReplayRecorder";
import WishlistRehydrator from "@/components/wishlist/WishlistRehydrator";
import GuestCartHydrator from "@/components/cart/GuestCartHydrator";
import { fetchShopNavCategoriesServer } from "@/lib/categoryServer";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";
import Navbar from "@/components/layout/Navbar";
import { MarketingEditionsProvider } from "@/lib/marketingEditionsContext";

const OfferVisitPopup = dynamic(() => import("@/components/coupons/OfferVisitPopup"));

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialNavCategories, initialStorefrontSettings] = await Promise.all([
    fetchShopNavCategoriesServer(),
    fetchStorefrontSettingsHome(),
  ]);

  return (
    <>
      <WishlistRehydrator />
      <GuestCartHydrator />
      <StoreVisitTracker />
      <SessionReplayRecorder />
      <Navbar initialNavCategories={initialNavCategories} />
      <main className='isolate min-h-screen flex flex-col bg-background pb-0 lg:pb-0'>
        <MarketingEditionsProvider
          editions={initialStorefrontSettings?.marketingEditions}
        >
          <StoreErrorBoundary>{children}</StoreErrorBoundary>
        </MarketingEditionsProvider>
      </main>
      <Footer
        initialNavCategories={initialNavCategories}
        initialStorefrontSettings={initialStorefrontSettings}
      />
      <StoreRaniCare />
      <OfferVisitPopup />
      <Suspense fallback={null}>
        <StoreAuthModal />
      </Suspense>
    </>
  );
}

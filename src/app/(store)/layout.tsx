import { Suspense } from "react";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import { StoreErrorBoundary } from "@/components/StoreErrorBoundary";
import { StoreRaniCare } from "@/components/support/StoreRaniCare";
import StoreAuthModal from "@/components/auth/StoreAuthModal";
import StoreVisitTracker from "@/components/analytics/StoreVisitTracker";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";
import { fetchShopNavCategoriesServer } from "@/lib/categoryServer";

function NavbarShellFallback() {
  return (
    <div
      className='sticky top-0 z-50 h-16 border-b border-navy-800 bg-navy-950'
      role='status'
      aria-label='Loading navigation'
    />
  );
}

const Navbar = dynamic(() => import("@/components/layout/Navbar"), {
  loading: () => <NavbarShellFallback />,
});

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, initialNavCategories] = await Promise.all([
    fetchStorefrontSettingsHome(),
    fetchShopNavCategoriesServer(),
  ]);
  const initialAnnouncementMessages =
    settings?.announcementMessages
      ?.map((m) => String(m || "").trim())
      .filter(Boolean) ?? [];

  return (
    <>
      <StoreVisitTracker />
      <Suspense fallback={<NavbarShellFallback />}>
        <Navbar
          initialAnnouncementMessages={initialAnnouncementMessages}
          initialNavCategories={initialNavCategories}
        />
      </Suspense>
      <main className='pb-0 lg:pb-0 min-h-screen flex flex-col '>
        <StoreErrorBoundary>{children}</StoreErrorBoundary>
      </main>
      <Footer initialNavCategories={initialNavCategories} />
      <StoreRaniCare />
      <Suspense fallback={null}>
        <StoreAuthModal />
      </Suspense>
    </>
  );
}

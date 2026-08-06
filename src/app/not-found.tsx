import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchShopNavCategoriesServer } from "@/lib/categoryServer";
import NotFoundClient from "./not-found-client";

export const metadata: Metadata = {
  title: "404 - Page Not Found | The House of Rani",
  description:
    "The page you are looking for could not be found on The House of Rani. Explore our royal collections of silk sarees, designer salwar suits, corsets, and luxury gifting.",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const initialNavCategories = await fetchShopNavCategoriesServer();

  return (
    <>
      <Navbar initialNavCategories={initialNavCategories} />
      <main className="min-h-[70vh]">
        <NotFoundClient />
      </main>
      <Footer initialNavCategories={initialNavCategories} />
    </>
  );
}

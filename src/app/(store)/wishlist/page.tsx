import type { Metadata } from "next";
import WishlistPageClient from "@/components/wishlist/WishlistPageClient";

export const metadata: Metadata = {
  title: "My Wishlist",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}

import { permanentRedirect } from "next/navigation";

export default function DashboardWishlistRedirect() {
  permanentRedirect("/wishlist");
}

import ShopLayoutClient from "@/components/shop/ShopLayoutClient";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShopLayoutClient>{children}</ShopLayoutClient>;
}

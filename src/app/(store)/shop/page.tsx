import { redirect } from "next/navigation";

export default async function ShopRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(sp as any).toString();
  redirect(`/shop/collections${qs ? `?${qs}` : ""}`);
}
